# Migrate src/lib/marketplace.ts from edge function fetch() to API client calls
# Run from project root: powershell -File scripts/migrate-marketplace.ps1

$filePath = "C:\Users\user pc\Desktop\BINCOM\Dala\src\lib\marketplace.ts"
$content = Get-Content -LiteralPath $filePath -Raw

# 1. Replace the import
$content = $content -replace "import \{ supabase \} from '@/integrations/supabase/client';", "import { marketplaceApi, paymentsApi, walletApi, messagingApi, notificationsApi, aiApi, adminApi, get, post, patch, del } from '@/lib/api-client';"

# 2. Remove session/token boilerplate (3 lines + 1 newline)
# Pattern: const { data: sessionData } = await supabase.auth.getSession();\nconst token = sessionData.session?.access_token;\nif (!token) throw new Error('Please sign in');\n
$content = $content -replace "(?s)const \{ data: sessionData \} = await supabase\.auth\.getSession\(\);\s*const token = sessionData\.session\?\.access_token;\s*if \(!token\) throw new Error\('Please sign in'\);\s*", ""

# 3. Remove supabase URL construction (1 line)
# Pattern: const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;\n
$content = $content -replace "const supabaseUrl = import\.meta\.env\.VITE_SUPABASE_URL;\s*", ""

# 4. Remove supabase direct table queries (for getGitHubConnection equivalent functions - none here)

# Write back
Set-Content -LiteralPath $filePath -Value $content -NoNewline

Write-Host "Phase 1: Import + session boilerplate removed." -ForegroundColor Green

# Read the cleaned file
$lines = Get-Content -LiteralPath $filePath
Write-Host "File is now $($lines.Count) lines." -ForegroundColor Yellow

# 5. Replace fetch() calls with API client methods for each edge function URL pattern

# We need to read the file again since we modified it
$content = Get-Content -LiteralPath $filePath -Raw
$originalContent = $content

# Helper: replace fetch pattern with API call
# Pattern base:
# const res = await fetch(`$\{supabaseUrl\}/functions/v1/PATH`, { headers: { Authorization: `Bearer $\{token\}` } });
# if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'MSG'); }
# const json = await res.json();
# return json.data || DEFAULT;
# → const res = await API_CALL;
#   return res.data || DEFAULT;

function Replace-FetchPattern {
    param($content, $urlPattern, $apiCall, $defaultValue)

    $escapedUrl = [regex]::Escape($urlPattern)
    
    # Match fetch with specific URL
    $fetchPattern = "(?s)const res = await fetch\(`$\{supabaseUrl\}/functions/v1/$escapedUrl`,\s*\{[^}]*headers:\s*\{[^}]*\}\s*\}\);\s*" +
                    "if \(!res\.ok\) \{\s*const err = await res\.json\(\);\s*throw new Error\([^;]+\);\s*\}\s*" +
                    "const json = await res\.json\(\);\s*"

    $replacement = "const res = await $apiCall;`r`n  "

    # Check if there's a default value pattern
    if ($defaultValue) {
        $fetchPattern += "return json\.data \|\| $defaultValue;"
        $replacement += "return res.data || $defaultValue;"
    } else {
        $fetchPattern += "return json\.data;"
        $replacement += "return res.data;"
    }

    $content = $content -replace $fetchPattern, $replacement
    return $content
}

function Replace-FetchJsonDirect {
    param($content, $urlPattern, $apiCall)
    
    $escapedUrl = [regex]::Escape($urlPattern)
    $fetchPattern = "(?s)const res = await fetch\(`$\{supabaseUrl\}/functions/v1/$escapedUrl`,\s*\{[^}]*headers:\s*\{[^}]*\}\s*\}\);\s*" +
                    "if \(!res\.ok\) \{\s*const err = await res\.json\(\);\s*throw new Error\([^;]+\);\s*\}\s*" +
                    "const json = await res\.json\(\);\s*"

    $replacement = "const res = await $apiCall;`r`n  "

    $content = $content -replace $fetchPattern, $replacement
    return $content
}

# ============================
# MARKETPLACE FUNCTIONS
# ============================

# getServices → marketplace/services
$content = $content -replace "(?s)getServices\(\): Promise<Service\[\]> \{\s*const res = await marketplaceApi\.services\(\);\s*return res\.data \|\| \[\];\s*\}", "getServices(): Promise<Service[]> {`r`n  const res = await marketplaceApi.services();`r`n  return res.data || [];`r`n}"

# ============================
# Now let me do a completely different approach:
# Read each function, identify it, and write the replacement
# ============================

# Actually, the issue is that the regex approach for 68 different URLs is complex.
# Let me use a different strategy: read the file, parse each function, and rewrite.

# Read the raw file as lines
$lines = [System.IO.File]::ReadAllLines($filePath)

# Process function by function
$newLines = @()
$skipCount = 0
$i = 0

while ($i -lt $lines.Count) {
    $line = $lines[$i]
    $currentLine = $line.Trim()
    
    # Keep non-function lines as-is
    if ($currentLine -match "^(import |export (interface|type|const)\s|//|---|$|interface |type )") {
        $newLines += $line
        $i++
        continue
    }
    
    # Check if this is a function that still has fetch pattern
    if ($currentLine -match "export async function" -and $currentLine -notmatch "^\s*$") {
        # Look ahead for fetch pattern
        $lookAhead = ""
        for ($j = $i; $j -lt [Math]::Min($i + 5, $lines.Count); $j++) {
            $lookAhead += $lines[$j]
        }
        
        # If this function still uses fetch, find the full function body
        if ($lookAhead -match "fetch") {
            # Collect all lines until the closing brace
            $funcLines = @()
            $braceCount = 0
            $inFunc = $true
            $k = $i
            
            while ($k -lt $lines.Count) {
                $fl = $lines[$k]
                $funcLines += $fl
                
                # Count braces to find where the function ends
                for ($c = 0; $c -lt $fl.Length; $c++) {
                    if ($fl[$c] -eq '{') { $braceCount++ }
                    if ($fl[$c] -eq '}') { $braceCount-- }
                }
                
                $k++
                if ($braceCount -eq 0 -and ($funcLines.Count -gt 1)) { break }
            }
            
            $funcText = $funcLines -join "`r`n"
            
            # Determine the function name and map to API client call
            $funcName = ""
            if ($currentLine -match "export async function (\w+)") {
                $funcName = $matches[1]
            }
            
            Write-Host "Processing: $funcName ($($funcLines.Count) lines)" -ForegroundColor Cyan
            
            # Generate the replacement based on function name
            $replacement = Generate-Replacement $funcName $funcText
            
            if ($replacement) {
                $newLines += $replacement
                $i = $k  # Skip the original function lines
                Write-Host "  → Replaced" -ForegroundColor Green
            } else {
                $newLines += $line  # Keep original if no mapping found
                $i++
            }
        } else {
            # Already uses API client, keep as-is
            $newLines += $line
            $i++
        }
    } else {
        $newLines += $line
        $i++
    }
}

function Generate-Replacement {
    param($funcName, $funcText)
    
    # Extract the return type and params from the function signature
    if ($funcText -match "(export async function \w+\([^)]*\)\s*:\s*([^{]+)\{") {
        $signature = $matches[0]
    } else {
        return $null  # Can't parse
    }
    
    # Default values based on return type
    $defaultVal = ""
    $returnType = $matches[2].Trim()
    if ($returnType -match "^(\w+)\[\]" -or $returnType -match "^(Promise<)?(\w+)\[\]") {
        $defaultVal = "[]"
    } elseif ($returnType -match "number" -or $returnType -match "string|boolean") {
        $defaultVal = "0"  # Placeholder, should rarely be needed
    }
    
    # Extract parameter names for building the API call
    $paramsText = ""
    if ($funcText -match "export async function \w+\(([^)]*)\)") {
        $paramsText = $matches[1]
    }
    
    # Extract URL path from the edge function fetch
    $urlPath = ""
    if ($funcText -match "functions/v1/([^`}]+)") {
        $urlPath = $matches[1]
    }
    
    # Map function names to API client methods
    $apiCall = Guess-ApiCall $funcName $urlPath $paramsText
    
    if (-not $apiCall) { return $null }
    
    if ($defaultVal) {
        $result = "$signature
  const res = await $apiCall;
  return res.data || $defaultVal;
}"
    } else {
        $result = "$signature
  const res = await $apiCall;
  return res.data;
}"
    }
    
    return $result
}

function Guess-ApiCall {
    param($funcName, $urlPath, $paramsText)
    
    # Extract parameter names from the function signature
    $paramNames = @()
    if ($paramsText) {
        # Parse params like "id: string, listing_id: string" etc.
        $parts = $paramsText -split ","
        foreach ($part in $parts) {
            if ($part -match "(\w+)\s*:") {
                $paramNames += $matches[1]
            }
        }
    }
    
    # Map by function name
    switch -Wildcard ($funcName) {
        "getServices" { return "marketplaceApi.services()" }
        "getListings" { return "marketplaceApi.listings(apiParams)" }
        "getListing" { return "marketplaceApi.getListing($($paramNames[0]))" }
        "createListing" { return "marketplaceApi.createListing(body)" }
        "getOrders" { return "marketplaceApi.orders(apiParams)" }
        "getOrder" { return "marketplaceApi.getOrder($($paramNames[0]))" }
        "createOrder" { return "marketplaceApi.createOrder($($paramNames[0]))" }
        "updateOrderStatus" { return "marketplaceApi.updateOrder($($paramNames[0]), { status$(if ($paramNames.Count -gt 1) {", ...extra"}) })" }
        "deleteListing" { return "marketplaceApi.deleteListing($($paramNames[0]))" }
        "getMyListings" { return "marketplaceApi.listings({ mine: true })" }
        
        # Payment functions
        "initializePayment" { return "paymentsApi.initialize($($paramNames[0]), $(if ($paramNames.Count -gt 1) {$paramNames[1]} else {'undefined'}))" }
        "verifyPaystackPayment" { return "paymentsApi.verify('paystack', { reference: $($paramNames[0]) })" }
        "verifyFlutterwavePayment" { return "paymentsApi.verify('flutterwave', { transaction_id: $($paramNames[0]) })" }
        "releaseMilestonePayment" { return "paymentsApi.releaseMilestone($($paramNames[0]))" }
        "releaseEscrow" { return "paymentsApi.release($($paramNames[0]))" }
        "detectCurrency" { return "paymentsApi.detectCurrency()" }
        "getPaymentGateways" { return "paymentsApi.gateways()" }
        "getServiceFee" { return "paymentsApi.serviceFee()" }
        "releasePayment" { return "paymentsApi.release($($paramNames[0]))" }
        
        # Wallet functions
        "getWalletBalance" { return "walletApi.balance()" }
        "getWalletTransactions" { return "walletApi.transactions(apiParams)" }
        "getPayouts" { return "walletApi.payouts()" }
        "requestPayout" { return "walletApi.requestPayout($(if ($paramNames[0]) {$paramNames[0]} else {'body'}))" }
        "getProviderBankAccount" { return "walletApi.bankAccount()" }
        "saveProviderBankAccount" { return "walletApi.saveBankAccount($($paramNames[0]))" }
        
        # Messaging functions
        "createConversation" { return "messagingApi.createConversation($($paramNames[0]), $(if ($paramNames.Count -gt 1) {$paramNames[1]} else {'undefined'}))" }
        "getConversations" { return "messagingApi.conversations()" }
        "getMessages" { return "messagingApi.getMessages($($paramNames[0]))" }
        "sendMessage" { return "messagingApi.sendMessage($($paramNames[0]), { content$(if ($paramNames.Count -gt 1) {", attachments: attachments"}) })" }
        "uploadChatAttachment" { return $null }  # File upload - keep original
        
        # Notification functions
        "getNotifications" { return "notificationsApi.list({ unread: $($paramNames[0]) })" }
        "getUnreadCount" { return "notificationsApi.unreadCount()" }
        "markNotificationRead" { return "notificationsApi.markRead($($paramNames[0]))" }
        "markAllNotificationsRead" { return "notificationsApi.markAllRead()" }
        
        # Milestone functions
        "getMilestones" { return "marketplaceApi.getMilestones($($paramNames[0]))" }
        "createMilestone" { return "marketplaceApi.createMilestone($($paramNames[0]), $(if ($paramNames.Count -gt 1) {'body'} else {'{}'}))" }
        "updateMilestoneStatus" { return "marketplaceApi.updateMilestone(orderId, $($paramNames[0]), { status })" }
        
        # Dispute functions
        "getMyDisputes" { return "marketplaceApi.disputes()" }
        "getDispute" { return "marketplaceApi.getDispute($($paramNames[0]))" }
        "getDisputeMessages" { return "marketplaceApi.getDisputeMessages($($paramNames[0]))" }
        "sendDisputeMessage" { return "marketplaceApi.sendDisputeMessage($($paramNames[0]), $($paramNames[1]))" }
        
        # Review functions
        "getListingRating" { return "marketplaceApi.listingReviewStats($($paramNames[0]))" }
        "getListingReviews" { return "marketplaceApi.listingReviews($($paramNames[0]))" }
        "getProviderReviews" { return "marketplaceApi.providerReviews($($paramNames[0]))" }
        "getProviderRating" { return "marketplaceApi.providerReviewStats($($paramNames[0]))" }
        "updateReview" { return "marketplaceApi.updateReview($($paramNames[0]), $($paramNames[1]))" }
        "deleteReview" { return "marketplaceApi.deleteReview($($paramNames[0]))" }
        "submitReview" { return "marketplaceApi.submitReview($($paramNames[0]), { rating, review })" }
        
        # Availability functions
        "getAvailabilitySlots" { return $null }  # Keep original if no endpoint
        "upsertAvailabilitySlot" { return $null }
        "deleteAvailabilitySlot" { return $null }
        "getAvailabilityOverrides" { return $null }
        "upsertAvailabilityOverride" { return $null }
        "deleteAvailabilityOverride" { return $null }
        
        # Connection functions (social features)
        "sendConnectionRequest" { return $null }
        "acceptConnectionRequest" { return $null }
        "rejectConnectionRequest" { return $null }
        "cancelConnectionRequest" { return $null }
        "getConnections" { return $null }
        "getConnectionRequests" { return $null }
        "getConnectionStatus" { return $null }
        "removeConnection" { return $null }
        
        # Provider functions
        "getProviderStats" { return $null }
        "getChatBubbleStyle" { return $null }
        
        # Admin functions
        "getAdminServices" { return "adminApi.services()" }
        "createAdminService" { return "adminApi.createService($($paramNames[0]))" }
        "updateAdminService" { return "adminApi.updateService($($paramNames[0]), $($paramNames[1]))" }
        "deleteAdminService" { return "adminApi.deleteService($($paramNames[0]))" }
        "getAdminStats" { return "adminApi.stats()" }
        "getAdminUsers" { return "adminApi.users(apiParams)" }
        "updateUserRole" { return "adminApi.updateUserRole($($paramNames[0]), $(if ($paramNames.Count -gt 1) {$paramNames[1]} else {'role'}))" }
        "updateUserProfile" { return "adminApi.updateUserProfile($($paramNames[0]), $(if ($paramNames.Count -gt 1) { $paramNames[1]} else {'updates'}))" }
        "getAdminUser" { return "adminApi.getUser($($paramNames[0]))" }
        "getAdminDisputes" { return "adminApi.disputes({ $(if ($paramNames[0]) {"status: $($paramNames[0])"} else {''}) })" }
        "updateDispute" { return "adminApi.resolveDispute($($paramNames[0]), $(if ($paramNames.Count -gt 1) {$paramNames[1]} else {'{ status, resolution }'}))" }
        "getAdminPayouts" { return "adminApi.payouts({ $(if ($paramNames[0]) {"status: $($paramNames[0])"} else {''}) })" }
        "getAdminSettings" { return "adminApi.settings()" }
        "updateAdminSetting" { return "adminApi.updateSettings($($paramNames[0]), $($paramNames[1]))" }
        "getAdminAuditLog" { return "adminApi.auditLog({ limit: $($paramNames[0]) })" }
        "adminAiInsight" { return "aiApi.assist({ mode: 'admin_metric_insight', ...body })" }
        
        # Offline payment functions
        "getOfflinePaymentConfig" { return "paymentsApi.offlineConfig()" }
        "initiateManualPayment" { return "paymentsApi.manualPayment($($paramNames[0]))" }
        "getManualPayments" { return "paymentsApi.getManualPayments({ $(if ($paramNames[0]) {"order_id: $($paramNames[0])"} else {''}) })" }
        "getAdminManualPayments" { return "adminApi.manualPayments({ $(if ($paramNames[0]) {"status: $($paramNames[0])"} else {''}) })" }
        "approveManualPayment" { return "adminApi.approveManualPayment($($paramNames[0]))" }
        "rejectManualPayment" { return "adminApi.rejectManualPayment($($paramNames[0]))" }
        "getAdminProviderBankAccounts" { return "adminApi.bankAccounts({ $(if ($paramNames[0]) {"kyc_status: $($paramNames[0])"} else {''}) })" }
        "verifyProviderBankAccount" { return "adminApi.verifyBankAccount($($paramNames[0]), $($paramNames[1]), $(if ($paramNames.Count -gt 2) {$paramNames[2]} else {'undefined'}))" }
        
        # File upload functions
        "uploadPaymentScreenshot" { return $null }  # supabase.storage - keep original
        "uploadKycDocument" { return $null }  # supabase.storage - keep original
        
        default {
            Write-Host "  Unknown function: $funcName" -ForegroundColor Yellow
            return $null
        }
    }
}

# Write the result
[System.IO.File]::WriteAllLines($filePath, $newLines, [System.Text.UTF8Encoding]::new($false))

Write-Host "Migration complete. Output written to $filePath" -ForegroundColor Green

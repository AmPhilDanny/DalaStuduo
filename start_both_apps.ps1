# Stop any existing processes
taskkill /f /im bun.exe 2>$null
taskkill /f /im node.exe 2>$null
Start-Sleep -Seconds 2

# Start admin app on port 3001
$adminLog = "C:\Users\user pc\Desktop\Dala\vite-admin-log.txt"
$adminErr = "C:\Users\user pc\Desktop\Dala\vite-admin-err.txt"
$adminDir = "C:\Users\user pc\Desktop\Dala\admin"
Start-Process -FilePath "bun.exe" -ArgumentList "--cwd `"$adminDir`" vite --port 3001 --host" -WindowStyle Hidden -RedirectStandardOutput $adminLog -RedirectStandardError $adminErr

# Start main app on port 3000
$mainLog = "C:\Users\user pc\Desktop\Dala\vite-main-log.txt"
$mainErr = "C:\Users\user pc\Desktop\Dala\vite-main-err.txt"
$mainDir = "C:\Users\user pc\Desktop\Dala\Skillbridge"
Start-Process -FilePath "bun.exe" -ArgumentList "--cwd `"$mainDir`" vite --port 3000 --host" -WindowStyle Hidden -RedirectStandardOutput $mainLog -RedirectStandardError $mainErr

# Wait for both to start
Start-Sleep -Seconds 25

# Verify
$adminOk = $false
$mainOk = $false
try { $r = Invoke-WebRequest -Uri "http://localhost:3001/" -TimeoutSec 5 -UseBasicParsing; if ($r.StatusCode -eq 200) { $adminOk = $true } } catch {}
try { $r = Invoke-WebRequest -Uri "http://localhost:3000/" -TimeoutSec 5 -UseBasicParsing; if ($r.StatusCode -eq 200) { $mainOk = $true } } catch {}

Write-Output "Admin (port 3001): $(if ($adminOk) { 'UP' } else { 'DOWN' })"
Write-Output "Main  (port 3000): $(if ($mainOk) { 'UP' } else { 'DOWN' })"

# Keep running so the processes persist
Wait-Process -Name bun -ErrorAction SilentlyContinue | Out-Null

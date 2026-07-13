/**
 * V2: Migrate marketplace.ts from edge function fetch() to API client calls.
 * Handles multiline signatures, correct indentation, and proper parameter mapping.
 * Run: node "scripts/migrate-marketplace.mjs"
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const filePath = process.argv[2] || path.join(ROOT, 'src', 'lib', 'marketplace.ts');

console.log(`Reading: ${filePath}`);
const content = fs.readFileSync(filePath, 'utf-8');
const lines = content.split('\n');

const API_MAP = {
  getServices:             () => ['marketplaceApi.services()', '[]'],
  getListings:             () => ['marketplaceApi.listings(apiParams)', '[]'],
  getListing:              (p) => [`marketplaceApi.getListing(${p[0]})`, null],
  createListing:           () => ['marketplaceApi.createListing(body)', null],
  deleteListing:           (p) => [`marketplaceApi.deleteListing(${p[0]})`, null],
  getMyListings:           () => ['marketplaceApi.listings({ mine: true })', '[]'],
  getOrders:               () => ['marketplaceApi.orders(apiParams)', '[]'],
  getOrder:                (p) => [`marketplaceApi.getOrder(${p[0]})`, null],
  createOrder:             (p) => [`marketplaceApi.createOrder(${p[0]})`, null],
  updateOrderStatus:       (p) => [`marketplaceApi.updateOrder(${p[0]}, { status, ...extra })`, null],
  initializePayment:       (p) => [`paymentsApi.initialize(${p[0]}${p[1] ? `, ${p[1]}` : ''})`, null],
  verifyPaystackPayment:   (p) => [`paymentsApi.verify('paystack', { reference: ${p[0]} })`, null],
  verifyFlutterwavePayment:(p) => [`paymentsApi.verify('flutterwave', { transaction_id: ${p[0]} })`, null],
  releaseMilestonePayment: (p) => [`paymentsApi.releaseMilestone(${p[0]})`, null],
  releaseEscrow:           (p) => [`paymentsApi.release(${p[0]})`, null],
  detectCurrency:          () => ['paymentsApi.detectCurrency()', null],
  getPaymentGateways:      () => ['paymentsApi.gateways()', null],
  getServiceFee:           () => ['paymentsApi.serviceFee()', null],
  releasePayment:          (p) => [`paymentsApi.release(${p[0]})`, null],
  getWalletBalance:        () => ['walletApi.balance()', null],
  getWalletTransactions:   () => ['walletApi.transactions(apiParams)', '[]'],
  getPayouts:              () => ['walletApi.payouts()', '[]'],
  requestPayout:           () => ['walletApi.requestPayout(body)', null],
  getProviderBankAccount:  () => ['walletApi.bankAccount()', null],
  saveProviderBankAccount: () => ['walletApi.saveBankAccount(body)', null],
  createConversation:      (p) => [`messagingApi.createConversation(${p[0]}${p[1] ? `, ${p[1]}` : 'undefined'})`, null],
  getConversations:        () => ['messagingApi.conversations()', '[]'],
  getMessages:             (p) => [`messagingApi.getMessages(${p[0]})`, '[]'],
  sendMessage:             (p) => [`messagingApi.sendMessage(${p[0]}, { content, attachments })`, null],
  getNotifications:        (p) => [`notificationsApi.list({ unread: ${p[0] || false} })`, '[]'],
  getUnreadCount:          () => ['notificationsApi.unreadCount()', null],
  markNotificationRead:    (p) => [`notificationsApi.markRead(${p[0]})`, null],
  markAllNotificationsRead:() => ['notificationsApi.markAllRead()', null],
  getMilestones:           (p) => [`marketplaceApi.getMilestones(${p[0]})`, '[]'],
  createMilestone:         (p) => [`marketplaceApi.createMilestone(${p[0]}, body)`, null],
  updateMilestoneStatus:   (p, all) => [`marketplaceApi.updateMilestone(${all[0]}, ${p[0]}, { status })`, null],
  getMyDisputes:           () => ['marketplaceApi.disputes()', '[]'],
  getDispute:              (p) => [`marketplaceApi.getDispute(${p[0]})`, null],
  getDisputeMessages:      (p) => [`marketplaceApi.getDisputeMessages(${p[0]})`, '[]'],
  sendDisputeMessage:      (p) => [`marketplaceApi.sendDisputeMessage(${p[0]}, ${p[1]})`, null],
  getListingRating:        (p) => [`marketplaceApi.listingReviewStats(${p[0]})`, null],
  getListingReviews:       (p) => [`marketplaceApi.listingReviews(${p[0]})`, '[]'],
  getProviderReviews:      (p) => [`marketplaceApi.providerReviews(${p[0]})`, '[]'],
  getProviderRating:       (p) => [`marketplaceApi.providerReviewStats(${p[0]})`, null],
  updateReview:            (p) => [`marketplaceApi.updateReview(${p[0]}, body)`, null],
  deleteReview:            (p) => [`marketplaceApi.deleteReview(${p[0]})`, null],
  submitReview:            (p) => [`marketplaceApi.submitReview(${p[0]}, body)`, null],
  getOfflinePaymentConfig: () => ['paymentsApi.offlineConfig()', null],
  initiateManualPayment:   () => ['paymentsApi.manualPayment(body)', null],
  getManualPayments:       (p) => [`paymentsApi.getManualPayments({ order_id: ${p[0]} })`, '[]'],
  getAdminServices:        () => ['adminApi.services()', '[]'],
  createAdminService:      () => ['adminApi.createService(body)', null],
  updateAdminService:      (p) => [`adminApi.updateService(${p[0]}, body)`, null],
  deleteAdminService:      (p) => [`adminApi.deleteService(${p[0]})`, null],
  adminAiInsight:          () => ["aiApi.assist({ mode: 'admin_metric_insight', ...body })", null],
  getAdminStats:           () => ['adminApi.stats()', null],
  getAdminUsers:           () => ['adminApi.users(apiParams)', '[]'],
  updateUserRole:          (p) => [`adminApi.updateUserRole(${p[0]}, role)`, null],
  updateUserProfile:       (p) => [`adminApi.updateUserProfile(${p[0]}, updates)`, null],
  getAdminUser:            (p) => [`adminApi.getUser(${p[0]})`, null],
  getAdminDisputes:        (p) => [`adminApi.disputes(${p[0] ? `{ status: ${p[0]} }` : '{}'})`, '[]'],
  updateDispute:           (p) => [`adminApi.resolveDispute(${p[0]}, { status, resolution })`, null],
  getAdminPayouts:         (p) => [`adminApi.payouts(${p[0] ? `{ status: ${p[0]} }` : '{}'})`, '[]'],
  getAdminSettings:        () => ['adminApi.settings()', null],
  updateAdminSetting:      (p) => [`adminApi.updateSettings(${p[0]}, ${p[1]})`, null],
  getAdminAuditLog:        (p) => [`adminApi.auditLog({ limit: ${p[0]} })`, '[]'],
  getAdminManualPayments:  (p) => [`adminApi.manualPayments(${p[0] ? `{ status: ${p[0]} }` : '{}'})`, '[]'],
  approveManualPayment:    (p) => [`adminApi.approveManualPayment(${p[0]})`, null],
  rejectManualPayment:     (p) => [`adminApi.rejectManualPayment(${p[0]})`, null],
  getAdminProviderBankAccounts:(p)=>[`adminApi.bankAccounts(${p[0] ? `{ kyc_status: ${p[0]} }` : '{}'})`, '[]'],
  verifyProviderBankAccount:(p) => [`adminApi.verifyBankAccount(${p[0]}, ${p[1]}${p[2] ? `, ${p[2]}` : 'undefined'})`, null],
  // Keep original — no server endpoint yet or uses supabase.storage
  uploadChatAttachment:     null,
  uploadPaymentScreenshot:  null,
  uploadKycDocument:        null,
  sendConnectionRequest:    null,
  acceptConnectionRequest:  null,
  rejectConnectionRequest:  null,
  cancelConnectionRequest:  null,
  getConnections:           null,
  getConnectionRequests:    null,
  getConnectionStatus:      null,
  removeConnection:         null,
  getProviderStats:         null,
  getChatBubbleStyle:       null,
  getAvailabilitySlots:     null,
  upsertAvailabilitySlot:   null,
  deleteAvailabilitySlot:   null,
  getAvailabilityOverrides: null,
  upsertAvailabilityOverride:null,
  deleteAvailabilityOverride:null,
};

const result = [];
let i = 0;
let funcsFound = 0, migrated = 0, kept = 0, alreadyDone = 0;

while (i < lines.length) {
  const line = lines[i];
  const fnMatch = line.match(/^(\s*)export async function (\w+)\s*\(/);
  
  if (fnMatch) {
    funcsFound++;
    const indent = fnMatch[1];
    const funcName = fnMatch[2];
    const mapping = API_MAP[funcName];

    const sigLines = [line];
    let braceCount = 0;
    for (let c = 0; c < line.length; c++) {
      if (line[c] === '{') braceCount++;
      if (line[c] === '}') braceCount--;
    }
    i++;
    while (i < lines.length && braceCount === 0) {
      sigLines.push(lines[i]);
      for (let c = 0; c < lines[i].length; c++) {
        if (lines[i][c] === '{') braceCount++;
        if (lines[i][c] === '}') braceCount--;
      }
      i++;
    }

    const bodyLines = [];
    while (i < lines.length && braceCount > 0) {
      bodyLines.push(lines[i]);
      for (let c = 0; c < lines[i].length; c++) {
        if (lines[i][c] === '{') braceCount++;
        if (lines[i][c] === '}') braceCount--;
      }
      i++;
    }

    const fullFunction = sigLines.join('\n') + '\n' + bodyLines.join('\n');
    const usesFetch = fullFunction.includes('functions/v1/') || fullFunction.includes('VITE_SUPABASE_URL');

    if (!usesFetch) {
      result.push(fullFunction);
      alreadyDone++;
      continue;
    }
    if (mapping === null) {
      result.push(fullFunction);
      kept++;
      console.log(`  ⏭ ${funcName}: keeping original`);
      continue;
    }

    const sigText = sigLines.map(l => l.trim()).join(' ');
    const allParamsMatch = sigText.match(/^export async function \w+\(([^)]*)\)/);
    const params = allParamsMatch ? allParamsMatch[1].split(',').map(p => { const m = p.trim().match(/^(\w+)/); return m ? m[1] : ''; }).filter(Boolean) : [];
    
    const [apiCall, defaultVal] = typeof mapping === 'function' ? mapping(params, params) : [null, null];
    if (!apiCall) { result.push(fullFunction); kept++; continue; }

    const retExpr = defaultVal ? `return res.data || ${defaultVal};` : 'return res.data;';
    const replacement = `${sigLines.join('\n')}\n${indent}  const res = await ${apiCall};\n${indent}  ${retExpr}\n${indent}}`;
    result.push(replacement);
    migrated++;
    console.log(`  ✓ ${funcName} → ${apiCall}`);
  } else {
    result.push(line);
    i++;
  }
}

let final = result.join('\n');
const needsSupabase = final.includes('supabase.storage') || final.includes('supabase.from(') || final.includes('supabase.rpc(');
if (needsSupabase) {
  final = final.replace(/^import \{ supabase \} from ['"]@\/integrations\/supabase\/client['"];$/m,
    `import { supabase } from '@/integrations/supabase/client';\nimport { marketplaceApi, paymentsApi, walletApi, messagingApi, notificationsApi, aiApi, adminApi, get, post, patch, del } from '@/lib/api-client';`);
  console.log(`\n✓ Keeping supabase import`);
} else {
  final = final.replace(/^import \{ supabase \} from ['"]@\/integrations\/supabase\/client['"];\n?/m,
    `import { marketplaceApi, paymentsApi, walletApi, messagingApi, notificationsApi, aiApi, adminApi, get, post, patch, del } from '@/lib/api-client';\n`);
  console.log(`\n✓ Removed supabase import`);
}

fs.writeFileSync(filePath, final, 'utf-8');
console.log(`\n╔══════════════════════════════════════╗`);
console.log(`║  Migration complete                  ║`);
console.log(`║  Functions: ${funcsFound}  Migrated: ${migrated}  Kept: ${kept}  Already: ${alreadyDone}    ║`);
console.log(`╚══════════════════════════════════════╝`);

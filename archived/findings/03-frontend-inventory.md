# Frontend Inventory

## Routes & Pages (Main App — App.tsx)

| Route | Component | Status |
|-------|-----------|--------|
| `/` | Home | ✅ |
| `/auth` | Auth | ✅ |
| `/jobs` | Jobs | ✅ |
| `/talent` | Talent | ✅ |
| `/talent/:id` | Profile | ✅ |
| `/profile` | Profile | ✅ |
| `/projects` | Projects | ✅ |
| `/projects/:id` | ProjectDetail | ✅ |
| `/my-applications` | MyApplications | ✅ |
| `/tutor` | Tutor | ✅ |
| `/tutor/:id` | TutorChat | ✅ |
| `/dashboard` | UserDashboard | ✅ |
| `/dashboard/org` | OrgDashboard | ✅ |
| `/jobs/new` | PostJob | ✅ |
| `/marketplace` | Marketplace | ✅ |
| `/marketplace/new` | CreateListing | ✅ |
| `/marketplace/:id` | MarketplaceDetail | ✅ |
| `/orders` | MyOrders | ✅ |
| `/orders/:id` | OrderDetail | ✅ |
| `/wallet` | Wallet | ✅ |
| `/my-listings` | MyListings | ✅ |
| `/messages` | Messages | ✅ |
| `/connections` | Connections | ✅ |
| `/disputes` | Disputes | ✅ |
| `/disputes/:id` | DisputeDetail | ✅ |
| `/admin` | AdminDashboard | ✅ |
| `/b2b/setup` | OrgSetup | ✅ |
| `/b2b/invite/accept` | InviteAccept | ✅ (new) |
| `/b2b/dashboard` | B2BDashboard (nested) | ✅ |
| `/b2b/team` | TeamList | ✅ |
| `/b2b/talent` | TalentSearch | ✅ |
| `/b2b/talent/lists` | TalentListManager | ✅ |
| `/b2b/hiring` | BulkJobPost | ✅ |
| `/b2b/hiring/pipeline` | PipelineView | ✅ |
| `/b2b/contracts` | ContractList | ✅ |
| `/b2b/compliance` | ComplianceDashboard | ✅ |
| `/b2b/analytics` | AnalyticsDashboard | ✅ |
| `/b2b/settings` | SettingsPage | ✅ |

## Marketplace Components

| Component | File | Purpose |
|-----------|------|---------|
| PaymentCheckoutModal | `src/components/marketplace/PaymentCheckoutModal.tsx` | Gateway selection + payment |
| PaymentStatusBadge | `src/components/marketplace/PaymentStatusBadge.tsx` | Payment status display |
| EscrowReleaseButton | `src/components/marketplace/EscrowReleaseButton.tsx` | Escrow release action |
| ManualPaymentForm | `src/components/marketplace/ManualPaymentForm.tsx` | Bank transfer proof upload |
| ReviewForm | (inline in OrderDetail.tsx) | Star rating + review text |
| ReviewDisplay | `src/components/marketplace/ReviewDisplay.tsx` | Review listing |
| RatingBadge | `src/components/marketplace/RatingBadge.tsx` | Average rating display |

## B2B Components

| Component | File | Purpose |
|-----------|------|---------|
| B2BLayout | `src/b2b/components/layout/B2BLayout.tsx` | Sidebar + org switcher |
| B2BDashboard | `src/b2b/pages/B2BDashboard.tsx` | Org dashboard |
| OrgSetup | `src/b2b/pages/OrgSetup.tsx` | Org creation wizard |
| InviteAccept | `src/b2b/pages/InviteAccept.tsx` | Accept org invite |
| TeamList | `src/b2b/components/team/TeamList.tsx` | Team management |
| TalentSearch | `src/b2b/components/talent/TalentSearch.tsx` | Talent pool search |
| TalentListManager | `src/b2b/components/talent/TalentListManager.tsx` | Saved talent lists |
| BulkJobPost | `src/b2b/components/hiring/BulkJobPost.tsx` | Bulk job posting |
| PipelineView | `src/b2b/components/hiring/PipelineView.tsx` | Hiring pipeline |
| ContractList | `src/b2b/components/contracts/ContractList.tsx` | Contract management |
| ComplianceDashboard | `src/b2b/components/compliance/ComplianceDashboard.tsx` | Compliance |
| AnalyticsDashboard | `src/b2b/components/analytics/AnalyticsDashboard.tsx` | Analytics + CSV export |
| SubscriptionManager | `src/b2b/components/billing/SubscriptionManager.tsx` | Billing management |
| BrandingSettings | `src/b2b/components/branding/BrandingSettings.tsx` | Org branding |
| SettingsPage | `src/b2b/components/settings/SettingsPage.tsx` | Org settings |

## Admin Dashboard (Separate App)

| Route | Component | Purpose |
|-------|-----------|---------|
| `/` | AdminDashboard | All admin features in one view |

## B2B API Client Functions (src/b2b/lib/api.ts)

**56 exported functions** covering:
- Org CRUD (getMyOrg, createOrg, updateOrg)
- Member management (getOrgMembers, inviteMember, removeMember, changeMemberRole)
- Invites (getOrgInvites, cancelInvite, acceptInvite)
- Membership/switch (getMyMemberships, switchOrg)
- Subscription (getSubscription, changeSubscription, changeSubscriptionPlan)
- Talent (searchTalent, getSavedSearches, saveSearch, deleteSavedSearch)
- Talent lists (getTalentLists, createTalentList, deleteTalentList, getListTalent, saveTalentToList, removeTalentFromList)
- Hiring (postBulkJobs, getPipelineApplications, updatePipelineStatus, bulkUpdatePipelineStatus)
- Contracts (getContracts, createContract, getContract, updateContract, transitionContract, settleContract)
- Milestones (getContractMilestones, createContractMilestone, updateContractMilestone)
- Analytics (getAnalyticsOverview)
- Compliance (getVerification, submitVerification, reviewVerification, getComplianceReports, generateComplianceReport)
- Billing (getBillingPlans, getBillingInvoices, getBillingHistory)
- Branding (getBranding, updateBranding)
- Config (getPublicConfig)
- Calls (initCall, getCallHistory)

## Marketplace API Client Functions (src/lib/marketplace.ts)

Key functions:
- getServices, getListings, getListing, createListing
- getOrders, getOrder, createOrder, updateOrderStatus
- getMilestones, createMilestone, updateMilestoneStatus
- Payment: initializePayment, verifyPaystackPayment, verifyFlutterwavePayment, releaseEscrow, submitManualPayment
- Reviews: getListingReviews, getListingRating, getProviderReviews, getProviderRating, submitReview, updateReview, deleteReview
- Wallet: getWalletBalance, getTransactions, requestPayout
- Connections: getConnections, sendConnectionRequest, acceptConnectionRequest, rejectConnectionRequest
- Notifications: getNotifications, getUnreadCount, markAsRead, markAllAsRead

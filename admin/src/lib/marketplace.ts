import { supabase } from '@/integrations/supabase/client';

export interface Service {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category: string;
  base_price: number;
  is_active: boolean;
}

export interface MarketplaceListing {
  id: string;
  service_id: string;
  provider_id: string;
  title: string;
  description: string;
  price: number;
  duration_hours: number;
  status: 'active' | 'paused' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
  service?: Pick<Service, 'id' | 'name' | 'slug' | 'category'> | null;
  provider?: { id: string; full_name: string | null; avatar_url: string | null; headline?: string | null } | null;
}

export interface Order {
  id: string;
  listing_id: string;
  buyer_id: string;
  provider_id: string;
  amount: number;
  status: 'pending' | 'in_progress' | 'completed' | 'disputed' | 'cancelled' | 'refunded';
  rating: number | null;
  review: string | null;
  completed_at: string | null;
  created_at: string;
  listing?: { id: string; title: string; price: number } | null;
  buyer?: { id: string; full_name: string | null; avatar_url: string | null } | null;
  provider?: { id: string; full_name: string | null; avatar_url: string | null } | null;
}

export interface WalletBalance {
  balance: number;
  transaction_count: number;
}

export interface WalletTransaction {
  id: string;
  profile_id: string;
  type: 'credit' | 'debit' | 'payout' | 'refund' | 'bonus';
  amount: number;
  balance_after: number;
  reference: string;
  description: string | null;
  status: string;
  created_at: string;
}

export interface Payout {
  id: string;
  profile_id: string;
  amount: number;
  bank_name: string;
  account_number: string;
  account_name: string;
  status: 'pending' | 'processing' | 'paid' | 'rejected';
  admin_notes: string | null;
  created_at: string;
  profile?: { id: string; full_name: string | null; avatar_url: string | null };
}

// ── Listings ──

export async function getServices(): Promise<Service[]> {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) throw new Error('Please sign in');

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const res = await fetch(`${supabaseUrl}/functions/v1/marketplace-listings/services`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to fetch services');
  }
  const json = await res.json();
  return json.data || [];
}

export async function getListings(params?: {
  status?: string;
  category?: string;
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<MarketplaceListing[]> {
  const searchParams = new URLSearchParams();
  if (params?.status) searchParams.set('status', params.status);
  if (params?.category) searchParams.set('category', params.category);
  if (params?.search) searchParams.set('search', params.search);
  if (params?.limit) searchParams.set('limit', String(params.limit));
  if (params?.offset) searchParams.set('offset', String(params.offset));

  const qs = searchParams.toString();
  const path = `/marketplace-listings${qs ? `?${qs}` : ''}`;

  // Use the raw fetch approach since supabase.functions.invoke doesn't support query params
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) throw new Error('Please sign in');

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const res = await fetch(
    `${supabaseUrl}/functions/v1/marketplace-listings${qs ? `?${qs}` : ''}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to fetch listings');
  }
  const json = await res.json();
  return json.data || [];
}

export async function getListing(id: string): Promise<MarketplaceListing> {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) throw new Error('Please sign in');

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const res = await fetch(`${supabaseUrl}/functions/v1/marketplace-listings/listings/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to fetch listing');
  }
  const json = await res.json();
  return json.data;
}

export async function createListing(body: {
  title: string;
  description: string;
  price: number;
  service_id: string;
  duration_hours: number;
}): Promise<MarketplaceListing> {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) throw new Error('Please sign in');

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const res = await fetch(`${supabaseUrl}/functions/v1/marketplace-listings/listings`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to create listing');
  }
  const json = await res.json();
  return json.data;
}

// ── Orders ──

export async function getOrders(params?: {
  role?: 'buyer' | 'provider';
  status?: string;
  limit?: number;
  offset?: number;
}): Promise<Order[]> {
  const searchParams = new URLSearchParams();
  if (params?.role) searchParams.set('role', params.role);
  if (params?.status) searchParams.set('status', params.status);
  if (params?.limit) searchParams.set('limit', String(params.limit));
  if (params?.offset) searchParams.set('offset', String(params.offset));

  const qs = searchParams.toString();
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) throw new Error('Please sign in');

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const res = await fetch(
    `${supabaseUrl}/functions/v1/marketplace-orders${qs ? `?${qs}` : ''}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to fetch orders');
  }
  const json = await res.json();
  return json.data || [];
}

export async function getOrder(id: string): Promise<Order> {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) throw new Error('Please sign in');

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const res = await fetch(`${supabaseUrl}/functions/v1/marketplace-orders/orders/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to fetch order');
  }
  const json = await res.json();
  return json.data;
}

export async function createOrder(listing_id: string): Promise<Order> {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) throw new Error('Please sign in');

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const res = await fetch(`${supabaseUrl}/functions/v1/marketplace-orders/orders`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ listing_id }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to create order');
  }
  const json = await res.json();
  return json.data;
}

export async function updateOrderStatus(
  orderId: string,
  status: string,
  extra?: { rating?: number; review?: string }
): Promise<Order> {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) throw new Error('Please sign in');

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const res = await fetch(`${supabaseUrl}/functions/v1/marketplace-orders/orders/${orderId}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, ...extra }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to update order');
  }
  const json = await res.json();
  return json.data;
}

// ── Wallet & Payouts ──

export async function getWalletBalance(): Promise<WalletBalance> {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) throw new Error('Please sign in');

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const res = await fetch(`${supabaseUrl}/functions/v1/wallet-payouts/wallet/balance`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to fetch balance');
  const json = await res.json();
  return json.data;
}

export async function getWalletTransactions(params?: {
  type?: string;
  limit?: number;
  offset?: number;
}): Promise<WalletTransaction[]> {
  const searchParams = new URLSearchParams();
  if (params?.type) searchParams.set('type', params.type);
  if (params?.limit) searchParams.set('limit', String(params.limit));
  if (params?.offset) searchParams.set('offset', String(params.offset));
  const qs = searchParams.toString();

  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) throw new Error('Please sign in');

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const res = await fetch(
    `${supabaseUrl}/functions/v1/wallet-payouts/wallet/transactions${qs ? `?${qs}` : ''}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) throw new Error('Failed to fetch transactions');
  const json = await res.json();
  return json.data;
}

export async function getPayouts(): Promise<Payout[]> {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) throw new Error('Please sign in');

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const res = await fetch(`${supabaseUrl}/functions/v1/wallet-payouts/payouts`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to fetch payouts');
  const json = await res.json();
  return json.data;
}

export async function deleteListing(id: string): Promise<void> {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) throw new Error('Please sign in');

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const res = await fetch(`${supabaseUrl}/functions/v1/marketplace-listings/listings/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to delete listing');
  }
}

export async function requestPayout(body: {
  amount: number;
  bank_name: string;
  account_number: string;
  account_name: string;
}): Promise<Payout> {
  const { data, error } = await supabase.functions.invoke('wallet-payouts', {
    method: 'POST',
    body,
  });
  if (error) throw new Error(error.message);
  return data?.data;
}

// ── Manual Payments (Admin) ──

export interface ManualPayment {
  id: string;
  order_id: string;
  buyer_id: string;
  amount: number;
  bank_name: string;
  account_number: string;
  screenshot_url: string | null;
  notes: string | null;
  status: 'pending' | 'approved' | 'rejected';
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

export async function getAdminManualPayments(): Promise<ManualPayment[]> {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) throw new Error('Please sign in');
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const res = await fetch(`${supabaseUrl}/functions/v1/admin-api/admin/manual-payments`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to fetch manual payments');
  const json = await res.json();
  return json.data || [];
}

export async function approveManualPayment(paymentId: string): Promise<void> {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) throw new Error('Please sign in');
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const res = await fetch(`${supabaseUrl}/functions/v1/admin-api/admin/manual-payments/${paymentId}/approve`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to approve payment');
}

export async function rejectManualPayment(paymentId: string): Promise<void> {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) throw new Error('Please sign in');
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const res = await fetch(`${supabaseUrl}/functions/v1/admin-api/admin/manual-payments/${paymentId}/reject`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to reject payment');
}

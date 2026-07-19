import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Loader2, Shield, Search, CheckCircle2, XCircle, Eye, Key, Save, RefreshCw, CreditCard, DollarSign, Scale, MessageSquare, Download, Settings, LayoutGrid, ShoppingCart, Users, Wallet, Building2, Banknote, Image as ImageIcon, ChevronLeft, ChevronRight, Bell, LogOut, LayoutDashboard, Briefcase, ExternalLink, Calendar, FileText, Video } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { getPayouts, Payout, getAdminManualPayments, approveManualPayment, rejectManualPayment, ManualPayment } from '@/lib/marketplace';
import { get, post, patch, del } from '@/lib/api-client';
import { downloadCSV } from '@/lib/export';
import SiteSettingsTab from '@/components/admin/SiteSettingsTab';
import UserManagementTab from '@/components/admin/UserManagementTab';

const DEFAULT_ADMIN_EMAIL = 'admin@skillbridge.africa';

// ── Types ──

interface AdminService {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category: string;
  base_price: number;
  is_active: boolean;
}

interface AdminOrder {
  id: string;
  listing_id: string;
  buyer_id: string;
  provider_id: string;
  amount: number;
  status: string;
  rating: number | null;
  review: string | null;
  created_at: string;
  completed_at: string | null;
  listing: { title: string } | null;
  buyer: { id: string; full_name: string | null } | null;
  provider: { id: string; full_name: string | null } | null;
}

interface AdminProfile {
  id: string;
  full_name: string | null;
  email?: string | null;
  role: string;
  headline: string | null;
  avatar_url: string | null;
  created_at: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  typing: 'Typing & Transcription',
  research: 'Research',
  design: 'Design',
  tutoring: 'Tutoring',
  writing: 'Writing',
  development: 'Development',
  data_entry: 'Data Entry',
  virtual_assistance: 'Virtual Assistance',
  academic: 'Academic Support',
};

const ORDER_STATUS_STYLES: Record<string, string> = {
  pending: 'bg-yellow-500/15 text-yellow-700',
  in_progress: 'bg-blue-500/15 text-blue-700',
  completed: 'bg-green-500/15 text-green-700',
  disputed: 'bg-red-500/15 text-red-700',
  cancelled: 'bg-muted text-muted-foreground',
  refunded: 'bg-purple-500/15 text-purple-700',
};

export default function AdminDashboard() {
  const { user, profile, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState('services');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sessionReady, setSessionReady] = useState(false);

  const [services, setServices] = useState<AdminService[]>([]);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [users, setUsers] = useState<AdminProfile[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [orgs, setOrgs] = useState<any[]>([]);
  const [orgsLoading, setOrgsLoading] = useState(false);
  const [orgSearch, setOrgSearch] = useState('');
  const [selectedOrg, setSelectedOrg] = useState<any | null>(null);

  // Verifications
  const [verifications, setVerifications] = useState<any[]>([]);
  const [verificationsLoading, setVerificationsLoading] = useState(false);
  const [verifStatusFilter, setVerifStatusFilter] = useState('pending');
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewingVerification, setReviewingVerification] = useState<any | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [reviewingStatus, setReviewingStatus] = useState<'verified' | 'rejected' | null>(null);
  const [reviewProcessing, setReviewProcessing] = useState(false);

  // Plans
  const [plans, setPlans] = useState<any[]>([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [planDialogOpen, setPlanDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any | null>(null);
  const [planForm, setPlanForm] = useState({
    name: '', slug: '', description: '',
    price_monthly: 0, price_yearly: 0,
    features: '', is_active: true, sort_order: 0,
  });
  const [savingPlan, setSavingPlan] = useState(false);

  // Contracts
  const [contracts, setContracts] = useState<any[]>([]);
  const [contractsLoading, setContractsLoading] = useState(false);
  const [contractSearch, setContractSearch] = useState('');
  const [contractStatusFilter, setContractStatusFilter] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [orderStatus, setOrderStatus] = useState('');

  // Edit service dialog
  const [editingService, setEditingService] = useState<AdminService | null>(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editPrice, setEditPrice] = useState(0);

  // Payout action dialog
  const [selectedPayout, setSelectedPayout] = useState<Payout | null>(null);
  const [payoutNotes, setPayoutNotes] = useState('');
  const [processingPayout, setProcessingPayout] = useState(false);

  // AI Settings
  const [aiKeys, setAiKeys] = useState<Record<string, string>>({
    ai_openrouter_key: '',
    ai_mistral_key: '',
    ai_openai_key: '',
    ai_groq_key: '',
    ai_google_key: '',
    ai_togetherai_key: '',
  });
  const [aiEnabled, setAiEnabled] = useState<Record<string, boolean>>({
    ai_openrouter_key: true,
    ai_mistral_key: true,
    ai_openai_key: true,
    ai_groq_key: true,
    ai_google_key: true,
    ai_togetherai_key: true,
  });
  const [savingKeys, setSavingKeys] = useState(false);
  const [loadingKeys, setLoadingKeys] = useState(false);

  // Payment Gateway config
  const [paymentGateways, setPaymentGateways] = useState<Record<string, { public_key: string; secret_key: string; enabled: boolean }>>({});
  const [savingPaymentConfig, setSavingPaymentConfig] = useState(false);
  const [loadingPaymentConfig, setLoadingPaymentConfig] = useState(false);

  // Offline Payment config
  const [offlinePayment, setOfflinePayment] = useState({
    enabled: false, bank_name: '', account_number: '', account_name: '', routing_number: '', swift_code: '', instructions: '',
  });
  const [savingOfflinePayment, setSavingOfflinePayment] = useState(false);
  const [loadingOfflinePayment, setLoadingOfflinePayment] = useState(false);

  // Manual Payments
  const [manualPayments, setManualPayments] = useState<ManualPayment[]>([]);
  const [loadingManualPayments, setLoadingManualPayments] = useState(false);
  const [processingManualPayment, setProcessingManualPayment] = useState<string | null>(null);

  // Service Fee
  const [serviceFeePct, setServiceFeePct] = useState(5);
  const [savingServiceFee, setSavingServiceFee] = useState(false);

  // Auth
  const [loginEmail, setLoginEmail] = useState(DEFAULT_ADMIN_EMAIL);
  const [loginPassword, setLoginPassword] = useState('');
  const [signingIn, setSigningIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Disputes
  const [disputedOrders, setDisputedOrders] = useState<AdminOrder[]>([]);
  const [resolvingDispute, setResolvingDispute] = useState<string | null>(null);
  const [disputeAction, setDisputeAction] = useState<'refund' | 'release' | null>(null);

  const AI_PROVIDER_LABELS: Record<string, string> = {
    ai_openrouter_key: 'OpenRouter',
    ai_mistral_key: 'Mistral AI',
    ai_openai_key: 'OpenAI',
    ai_groq_key: 'Groq',
    ai_google_key: 'Google Gemini',
    ai_togetherai_key: 'Together AI',
  };

  const isAdminAccess = Boolean(
    user && (
      profile?.role === 'admin' ||
      user.email?.toLowerCase() === DEFAULT_ADMIN_EMAIL.toLowerCase()
    )
  );

  useEffect(() => {
    if (!user || !isAdminAccess) return;
    fetchAll();
  }, [user, profile, isAdminAccess]);

  const fetchAll = async () => {
    setIsLoading(true);
    try {
      const [svcRes, ordRes, usrRes, ptRes] = await Promise.all([
        supabase.from('services').select('*').order('name'),
        supabase
          .from('orders')
          .select('*, listing:marketplace_listings(title), buyer:profiles!buyer_id(id, full_name), provider:profiles!provider_id(id, full_name)')
          .order('created_at', { ascending: false })
          .limit(50),
        supabase
          .from('profiles')
          .select('id, full_name, role, headline, avatar_url, created_at')
          .order('created_at', { ascending: false })
          .limit(50),
        getPayouts(),
      ]);

      if (svcRes.error) throw svcRes.error;
      if (ordRes.error) throw ordRes.error;
      if (usrRes.error) throw usrRes.error;

      setServices(svcRes.data || []);
      setOrders(ordRes.data as unknown as AdminOrder[]);
      setUsers(usrRes.data || []);
      setPayouts(ptRes);
      loadAiKeys();
      loadPaymentConfig();
      loadServiceFee();
      loadDisputes();
      loadOfflinePaymentConfig();
      loadManualPayments();
    } catch (error) {
      toast.error('Failed to load admin data');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchOrgs = useCallback(async () => {
    setOrgsLoading(true);
    try {
      const result = await get<any[]>('/admin/orgs', { search: orgSearch || undefined, limit: 100 });
      setOrgs(result.data || []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load organizations');
    } finally {
      setOrgsLoading(false);
    }
  }, [orgSearch]);

  useEffect(() => {
    if (user && isAdminAccess) {
      fetchOrgs();
    }
  }, [user, isAdminAccess, fetchOrgs]);

  const fetchVerifications = useCallback(async () => {
    setVerificationsLoading(true);
    try {
      const result = await get<any[]>('/admin/verifications', {
        status: verifStatusFilter || undefined,
        limit: 100,
      });
      setVerifications(result.data || []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load verifications');
    } finally {
      setVerificationsLoading(false);
    }
  }, [verifStatusFilter]);

  useEffect(() => {
    if (user && isAdminAccess) {
      fetchVerifications();
    }
  }, [user, isAdminAccess, fetchVerifications]);

  const handleReviewVerification = async () => {
    if (!reviewingVerification || !reviewingStatus) return;
    setReviewProcessing(true);
    try {
      await patch(`/admin/verifications/${reviewingVerification.id}/review`, {
        status: reviewingStatus,
        notes: reviewNotes || undefined,
      });
      toast.success(`Verification ${reviewingStatus}`);
      setReviewDialogOpen(false);
      setReviewingVerification(null);
      setReviewNotes('');
      setReviewingStatus(null);
      fetchVerifications();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to review verification');
    } finally {
      setReviewProcessing(false);
    }
  };

  const fetchPlans = useCallback(async () => {
    setPlansLoading(true);
    try {
      const result = await get<any[]>('/admin/billing/plans');
      setPlans(result.data || []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load plans');
    } finally {
      setPlansLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user && isAdminAccess) {
      fetchPlans();
    }
  }, [user, isAdminAccess, fetchPlans]);

  const resetPlanForm = (plan?: any) => {
    setPlanForm({
      name: plan?.name || '',
      slug: plan?.slug || '',
      description: plan?.description || '',
      price_monthly: plan?.price_monthly ?? 0,
      price_yearly: plan?.price_yearly ?? 0,
      features: (plan?.features || []).join(', '),
      is_active: plan?.is_active ?? true,
      sort_order: plan?.sort_order ?? 0,
    });
  };

  const handleSavePlan = async () => {
    if (!planForm.name.trim() || !planForm.slug.trim()) return;
    setSavingPlan(true);
    try {
      const body = {
        name: planForm.name.trim(),
        slug: planForm.slug.trim(),
        description: planForm.description.trim() || undefined,
        price_monthly: planForm.price_monthly,
        price_yearly: planForm.price_yearly,
        features: planForm.features.split(',').map(s => s.trim()).filter(Boolean),
        is_active: planForm.is_active,
        sort_order: planForm.sort_order,
      };

      if (editingPlan) {
        await patch(`/admin/billing/plans/${editingPlan.id}`, body);
        toast.success('Plan updated');
      } else {
        await post('/admin/billing/plans', body);
        toast.success('Plan created');
      }
      setPlanDialogOpen(false);
      setEditingPlan(null);
      fetchPlans();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save plan');
    } finally {
      setSavingPlan(false);
    }
  };

  const handleDeletePlan = async (plan: any) => {
    if (!confirm(`Delete plan "${plan.name}"? ${plan.is_active ? ' It will be deactivated if orgs use it.' : ''}`)) return;
    try {
      await del(`/admin/billing/plans/${plan.id}`);
      toast.success('Plan deleted');
      fetchPlans();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete plan');
    }
  };

  const handleTogglePlanActive = async (plan: any) => {
    try {
      await patch(`/admin/billing/plans/${plan.id}`, { is_active: !plan.is_active });
      toast.success(`Plan ${plan.is_active ? 'deactivated' : 'activated'}`);
      fetchPlans();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update plan');
    }
  };

  const fetchContracts = useCallback(async () => {
    setContractsLoading(true);
    try {
      const params: Record<string, string | number | undefined> = { limit: 100 };
      if (contractStatusFilter) params.status = contractStatusFilter;
      if (contractSearch) params.search = contractSearch;
      const result = await get<any[]>('/admin/contracts', params);
      setContracts(result.data || []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load contracts');
    } finally {
      setContractsLoading(false);
    }
  }, [contractStatusFilter, contractSearch]);

  useEffect(() => {
    if (user && isAdminAccess) {
      fetchContracts();
    }
  }, [user, isAdminAccess, fetchContracts]);

  // Debounced search
  const [contractSearchInput, setContractSearchInput] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => setContractSearch(contractSearchInput), 400);
    return () => clearTimeout(timer);
  }, [contractSearchInput]);

  const saveService = async () => {
    if (!editingService) return;
    try {
      const { error } = await supabase
        .from('services')
        .update({ name: editName, description: editDesc, base_price: editPrice })
        .eq('id', editingService.id);
      if (error) throw error;
      toast.success('Service updated');
      setEditingService(null);
      fetchAll();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update');
    }
  };

  const handlePayoutAction = async (payoutId: string, status: 'paid' | 'rejected') => {
    setProcessingPayout(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error('Not authenticated');

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const res = await fetch(`${supabaseUrl}/functions/v1/wallet-payouts/payouts/${payoutId}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, admin_notes: payoutNotes }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to update payout');
      }

      toast.success(`Payout ${status}`);
      setSelectedPayout(null);
      setPayoutNotes('');
      fetchAll();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to process payout');
    } finally {
      setProcessingPayout(false);
    }
  };

  const toggleServiceActive = async (service: AdminService) => {
    try {
      const { error } = await supabase
        .from('services')
        .update({ is_active: !service.is_active })
        .eq('id', service.id);
      if (error) throw error;
      toast.success(`${service.name} ${service.is_active ? 'disabled' : 'enabled'}`);
      fetchAll();
    } catch (error) {
      toast.error('Failed to toggle service');
    }
  };

  const loadAiKeys = async () => {
    setLoadingKeys(true);
    try {
      const { data } = await supabase.from('site_settings').select('key, value');
      if (data) {
        setAiKeys((prev) => {
          const next = { ...prev };
          for (const entry of data) {
            const v = entry.value as Record<string, unknown> | null;
            if (entry.key in next) next[entry.key] = String((v?.api_key as string) || '');
          }
          return next;
        });
        // Also try to load enabled states from site_config.api_keys
        const { data: siteCfg } = await supabase.from('site_settings').select('value').eq('key', 'site_config').single();
        const siteCfgValue = siteCfg?.value as Record<string, unknown> | null;
        if (siteCfgValue?.api_keys) {
          setAiEnabled((prev) => {
            const next = { ...prev };
            for (const [k, v] of Object.entries(siteCfgValue.api_keys as Record<string, { enabled: boolean }>)) {
              if (k in next) next[k] = v.enabled !== false;
            }
            return next;
          });
        }
      }
    } catch {
      // silently fail
    } finally {
      setLoadingKeys(false);
    }
  };

  const loadPaymentConfig = async () => {
    setLoadingPaymentConfig(true);
    try {
      const { data } = await supabase.from('site_settings').select('value').eq('key', 'payment_gateways').maybeSingle();
      if (data?.value) {
        setPaymentGateways(data.value as Record<string, { public_key: string; secret_key: string; enabled: boolean }>);
      }
    } catch {
      // silent
    } finally {
      setLoadingPaymentConfig(false);
    }
  };

  const savePaymentConfig = async () => {
    setSavingPaymentConfig(true);
    try {
      const { data: existing } = await supabase.from('site_settings').select('id').eq('key', 'payment_gateways').maybeSingle();
      if (existing) {
        await supabase.from('site_settings').update({ value: paymentGateways }).eq('key', 'payment_gateways');
      } else {
        await supabase.from('site_settings').insert({ key: 'payment_gateways', value: paymentGateways });
      }
      toast.success('Payment gateway config saved');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save');
    } finally {
      setSavingPaymentConfig(false);
    }
  };

  const loadServiceFee = async () => {
    try {
      const { data } = await supabase.from('site_settings').select('value').eq('key', 'service_fee').maybeSingle();
      if (data?.value && typeof data.value === 'object' && 'percentage' in (data.value as Record<string, unknown>)) {
        setServiceFeePct(Number((data.value as Record<string, unknown>).percentage) || 5);
      }
    } catch {
      // silent
    }
  };

  const saveServiceFee = async () => {
    setSavingServiceFee(true);
    try {
      const val = { percentage: serviceFeePct };
      const { data: existing } = await supabase.from('site_settings').select('id').eq('key', 'service_fee').maybeSingle();
      if (existing) {
        await supabase.from('site_settings').update({ value: val }).eq('key', 'service_fee');
      } else {
        await supabase.from('site_settings').insert({ key: 'service_fee', value: val });
      }
      toast.success('Service fee updated');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save');
    } finally {
      setSavingServiceFee(false);
    }
  };

  const loadDisputes = async () => {
    try {
      const { data } = await supabase
        .from('orders')
        .select('*, listing:marketplace_listings(title), buyer:profiles!buyer_id(id, full_name), provider:profiles!provider_id(id, full_name)')
        .eq('status', 'disputed')
        .order('created_at', { ascending: false });
      setDisputedOrders((data || []) as unknown as AdminOrder[]);
    } catch {
      // silent
    }
  };

  const loadOfflinePaymentConfig = async () => {
    setLoadingOfflinePayment(true);
    try {
      const { data: sd } = await supabase.auth.getSession();
      const token = sd.session?.access_token;
      if (!token) return;
      const url = import.meta.env.VITE_SUPABASE_URL;
      const res = await fetch(`${url}/functions/v1/marketplace-payments/payments/offline-config`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          setOfflinePayment({
            enabled: json.data.enabled ?? false,
            bank_name: json.data.bank_name || '',
            account_number: json.data.account_number || '',
            account_name: json.data.account_name || '',
            routing_number: json.data.routing_number || '',
            swift_code: json.data.swift_code || '',
            instructions: json.data.instructions || '',
          });
        }
      }
    } catch {} finally {
      setLoadingOfflinePayment(false);
    }
  };

  const saveOfflinePaymentConfig = async () => {
    setSavingOfflinePayment(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error('Not authenticated');
      const url = import.meta.env.VITE_SUPABASE_URL;
      const res = await fetch(`${url}/functions/v1/admin-api/admin/settings`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'offline_payment', value: offlinePayment }),
      });
      if (!res.ok) throw new Error('Failed to save');
      toast.success('Offline payment config saved');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save');
    } finally {
      setSavingOfflinePayment(false);
    }
  };

  const loadManualPayments = async () => {
    setLoadingManualPayments(true);
    try {
      const data = await getAdminManualPayments();
      setManualPayments(data);
    } catch {} finally {
      setLoadingManualPayments(false);
    }
  };

  const handleApproveManualPayment = async (paymentId: string) => {
    setProcessingManualPayment(paymentId);
    try {
      await approveManualPayment(paymentId);
      toast.success('Payment approved');
      loadManualPayments();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to approve');
    } finally {
      setProcessingManualPayment(null);
    }
  };

  const handleRejectManualPayment = async (paymentId: string) => {
    setProcessingManualPayment(paymentId);
    try {
      await rejectManualPayment(paymentId);
      toast.success('Payment rejected');
      loadManualPayments();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to reject');
    } finally {
      setProcessingManualPayment(null);
    }
  };

  const resolveDispute = async (orderId: string, action: 'refund' | 'release') => {
    setResolvingDispute(orderId);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error('Not authenticated');

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const res = await fetch(`${supabaseUrl}/functions/v1/marketplace-orders/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: action === 'refund' ? 'refunded' : 'completed' }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to resolve dispute');
      }

      toast.success(`Dispute resolved: ${action === 'refund' ? 'refunded buyer' : 'released to provider'}`);
      setDisputeAction(null);
      loadDisputes();
      fetchAll();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to resolve dispute');
    } finally {
      setResolvingDispute(null);
    }
  };

  // ── Export handlers ──
  const exportServices = () => {
    downloadCSV(
      services.map((s) => ({ Name: s.name, Category: CATEGORY_LABELS[s.category] || s.category, Price: s.base_price, Active: s.is_active ? 'Yes' : 'No' })),
      'services'
    );
  };

  const exportOrders = () => {
    downloadCSV(
      filteredOrders.map((o) => ({
        Service: o.listing?.title || '',
        Buyer: o.buyer?.full_name || '',
        Provider: o.provider?.full_name || '',
        Amount: o.amount,
        Status: o.status,
        Date: new Date(o.created_at).toLocaleDateString(),
      })),
      'orders'
    );
  };

  const exportPayouts = () => {
    downloadCSV(
      payouts.map((p) => ({
        User: p.profile?.full_name || '',
        Amount: p.amount,
        Bank: p.bank_name,
        Account: `${p.account_name} / ${p.account_number}`,
        Status: p.status,
        Date: new Date(p.created_at).toLocaleDateString(),
      })),
      'payouts'
    );
  };

  const saveAiKeys = async () => {
    setSavingKeys(true);
    try {
      for (const [key, apiKey] of Object.entries(aiKeys)) {
        const { data: existing } = await supabase.from('site_settings').select('id').eq('key', key).maybeSingle();
        if (existing) {
          await supabase.from('site_settings').update({ value: { api_key: apiKey } }).eq('key', key);
        } else {
          await supabase.from('site_settings').insert({ key, value: { api_key: apiKey } });
        }
      }

      // Save enabled states to site_config.api_keys
      const { data: siteCfg } = await supabase.from('site_settings').select('value').eq('key', 'site_config').single();
      const updatedCfg = { ...((siteCfg?.value as Record<string, unknown>) || {}), api_keys: aiEnabled };
      if (siteCfg) {
        await supabase.from('site_settings').update({ value: updatedCfg }).eq('key', 'site_config');
      }

      toast.success('API keys saved. Changes apply on next edge function cold start.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save API keys');
    } finally {
      setSavingKeys(false);
    }
  };

  if (!user || !isAdminAccess) {
    return null;
  }

  const filteredUsers = users.filter((u) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      u.full_name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.role?.toLowerCase().includes(q)
    );
  });

  const filteredOrders = orders.filter((o) => {
    if (orderStatus && o.status !== orderStatus) return false;
    return true;
  });

  const pendingPayouts = payouts.filter((p) => p.status === 'pending');

  const NAV_ITEMS: { value: string; label: string; icon: React.ReactNode }[] = [
    { value: 'services', label: 'Services', icon: <LayoutGrid className="w-4 h-4" /> },
    { value: 'orders', label: 'Orders', icon: <ShoppingCart className="w-4 h-4" /> },
    { value: 'users', label: 'Users', icon: <Users className="w-4 h-4" /> },
    { value: 'payouts', label: 'Payouts', icon: <Wallet className="w-4 h-4" /> },
    { value: 'payment-gateways', label: 'Payment', icon: <CreditCard className="w-4 h-4" /> },
    { value: 'service-fee', label: 'Fees', icon: <DollarSign className="w-4 h-4" /> },
    { value: 'disputes', label: 'Disputes', icon: <Scale className="w-4 h-4" /> },
    { value: 'ai-settings', label: 'AI Settings', icon: <Key className="w-4 h-4" /> },
    { value: 'manual-payments', label: 'Manual Payments', icon: <Banknote className="w-4 h-4" /> },
    { value: 'site-settings', label: 'Site Settings', icon: <Settings className="w-4 h-4" /> },
    { value: 'video-calls', label: 'Video Calls', icon: <Video className="w-4 h-4" /> },
    { value: 'messages', label: 'Messages', icon: <MessageSquare className="w-4 h-4" /> },
  ];

  const pendingManualCount = manualPayments.filter((p) => p.status === 'pending').length;
  const showPayoutBadge = pendingPayouts.length > 0;
  const showDisputeBadge = disputedOrders.length > 0;
  const showManualBadge = pendingManualCount > 0;

  const B2B_NAV_ITEMS: { value: string; label: string; icon: React.ReactNode }[] = [
    { value: 'organizations', label: 'Organizations', icon: <Building2 className="w-4 h-4" /> },
    { value: 'verifications', label: 'Verifications', icon: <Shield className="w-4 h-4" /> },
    { value: 'plans', label: 'Subscription Plans', icon: <CreditCard className="w-4 h-4" /> },
    { value: 'contracts', label: 'Contracts', icon: <FileText className="w-4 h-4" /> },
  ];

  return (
    <div className="flex bg-gray-50 dark:bg-background pt-16 min-h-[calc(100vh-4rem)]">

      {/* Sidebar */}
      <aside className={`fixed left-0 top-16 h-[calc(100vh-4rem)] bg-gray-900 text-white flex flex-col transition-all duration-300 z-30 ${sidebarOpen ? 'w-56' : 'w-14'}`}>
        <div className="flex items-center justify-between px-3 py-4 border-b border-gray-700/50">
          {sidebarOpen && (
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-purple-400" />
              <span className="text-sm font-semibold">Admin</span>
            </div>
          )}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1.5 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-white transition-colors ml-auto">
            {sidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </div>
        <div className="flex-1 py-4 space-y-1 px-2 overflow-y-auto">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.value}
              onClick={() => setActiveTab(item.value)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === item.value
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              {item.icon}
              {sidebarOpen && <span className="truncate">{item.label}</span>}
              {sidebarOpen && item.value === 'payouts' && showPayoutBadge && (
                <span className="ml-auto bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">{pendingPayouts.length}</span>
              )}
              {sidebarOpen && item.value === 'disputes' && showDisputeBadge && (
                <span className="ml-auto bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">{disputedOrders.length}</span>
              )}
              {sidebarOpen && item.value === 'manual-payments' && showManualBadge && (
                <span className="ml-auto bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">{pendingManualCount}</span>
              )}
            </button>
          ))}

          {/* B2B section divider */}
          {sidebarOpen && (
            <div className="pt-4 pb-1">
              <div className="flex items-center gap-2 px-3">
                <div className="flex-1 h-px bg-gray-700/50" />
                <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-500">B2B</span>
                <div className="flex-1 h-px bg-gray-700/50" />
              </div>
            </div>
          )}
          {B2B_NAV_ITEMS.map((item) => (
            <button
              key={item.value}
              onClick={() => setActiveTab(item.value)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === item.value
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              {item.icon}
              {sidebarOpen && <span className="truncate">{item.label}</span>}
            </button>
          ))}
        </div>
      </aside>

      {/* Main Content */}
      <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-56' : 'ml-14'}`}>
        <div className="px-6 py-8 max-w-7xl mx-auto">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-8">
            <div className="rounded-xl border bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/20 dark:to-background p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-muted-foreground">Services</span>
                <div className="w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <LayoutGrid className="w-4.5 h-4.5 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <p className="text-3xl font-bold tracking-tight">{services.length}</p>
              <p className="text-xs text-muted-foreground mt-1">Total services</p>
            </div>
            <div className="rounded-xl border bg-gradient-to-br from-purple-50 to-white dark:from-purple-950/20 dark:to-background p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-muted-foreground">Orders</span>
                <div className="w-9 h-9 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <ShoppingCart className="w-4.5 h-4.5 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
              <p className="text-3xl font-bold tracking-tight">{orders.length}</p>
              <p className="text-xs text-muted-foreground mt-1">Total orders</p>
            </div>
            <div className="rounded-xl border bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950/20 dark:to-background p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-muted-foreground">Users</span>
                <div className="w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  <Users className="w-4.5 h-4.5 text-emerald-600 dark:text-emerald-400" />
                </div>
              </div>
              <p className="text-3xl font-bold tracking-tight">{users.length}</p>
              <p className="text-xs text-muted-foreground mt-1">Registered users</p>
            </div>
            <div className="rounded-xl border bg-gradient-to-br from-amber-50 to-white dark:from-amber-950/20 dark:to-background p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-muted-foreground">Pending Payouts</span>
                <div className="w-9 h-9 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                  <Wallet className="w-4.5 h-4.5 text-amber-600 dark:text-amber-400" />
                </div>
              </div>
              <p className="text-3xl font-bold tracking-tight text-amber-600 dark:text-amber-400">{pendingPayouts.length}</p>
              <p className="text-xs text-muted-foreground mt-1">Awaiting processing</p>
            </div>
          </div>

          {/* ═══ SERVICES ═══ */}
          {activeTab === 'services' && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Services</CardTitle>
                  <Button variant="outline" size="sm" onClick={exportServices}><Download className="w-3.5 h-3.5 mr-1" /> Export CSV</Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Base Price</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {services.map((svc) => (
                      <TableRow key={svc.id}>
                        <TableCell className="font-medium">{svc.name}</TableCell>
                        <TableCell>{CATEGORY_LABELS[svc.category] || svc.category}</TableCell>
                        <TableCell>₦{Number(svc.base_price).toLocaleString()}</TableCell>
                        <TableCell><Badge variant={svc.is_active ? 'default' : 'secondary'}>{svc.is_active ? 'Active' : 'Disabled'}</Badge></TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button size="sm" variant="outline" onClick={() => { setEditingService(svc); setEditName(svc.name); setEditDesc(svc.description || ''); setEditPrice(svc.base_price); }}>Edit</Button>
                            <Button size="sm" variant={svc.is_active ? 'secondary' : 'default'} onClick={() => toggleServiceActive(svc)}>{svc.is_active ? 'Disable' : 'Enable'}</Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* ═══ ORDERS ═══ */}
          {activeTab === 'orders' && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Orders</CardTitle>
                  <div className="flex items-center gap-3">
                    <Button variant="outline" size="sm" onClick={exportOrders}><Download className="w-3.5 h-3.5 mr-1" /> Export CSV</Button>
                    <Select value={orderStatus} onValueChange={setOrderStatus}>
                      <SelectTrigger className="w-36"><SelectValue placeholder="All statuses" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All statuses</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="disputed">Disputed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Service</TableHead><TableHead>Buyer</TableHead><TableHead>Provider</TableHead>
                      <TableHead>Amount</TableHead><TableHead>Status</TableHead><TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrders.map((ord) => (
                      <TableRow key={ord.id}>
                        <TableCell className="max-w-[200px] truncate">{ord.listing?.title || '—'}</TableCell>
                        <TableCell>{ord.buyer?.full_name || '—'}</TableCell>
                        <TableCell>{ord.provider?.full_name || '—'}</TableCell>
                        <TableCell>₦{Number(ord.amount).toLocaleString()}</TableCell>
                        <TableCell>
                          <Select value={ord.status} onValueChange={async (newStatus) => {
                            try {
                              const { data: ses } = await supabase.auth.getSession();
                              const tok = ses.session?.access_token;
                              if (!tok) throw new Error('Not authenticated');
                              const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
                              const res = await fetch(`${supabaseUrl}/functions/v1/marketplace-orders/orders/${ord.id}`, {
                                method: 'PATCH', headers: { Authorization: `Bearer ${tok}`, 'Content-Type': 'application/json' },
                                body: JSON.stringify({ status: newStatus }),
                              });
                              if (!res.ok) throw new Error('Failed');
                              toast.success(`Order ${newStatus}`);
                              fetchAll();
                            } catch { toast.error('Failed to update order status'); }
                          }}>
                            <SelectTrigger className="h-7 w-32 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="in_progress">In Progress</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                              <SelectItem value="cancelled">Cancelled</SelectItem>
                              <SelectItem value="refunded">Refunded</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{new Date(ord.created_at).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button size="sm" variant="ghost" asChild>
                              <a href={`https://supabase.com/dashboard/project/krihvhyexqstphxqkljr/editor/r/orders/${ord.id}`} target="_blank" rel="noopener noreferrer"><Eye className="w-3.5 h-3.5" /></a>
                            </Button>
                            {(ord.status === 'pending' || ord.status === 'in_progress') && (
                              <Button size="sm" variant="ghost" className="text-red-500" onClick={async () => {
                                try {
                                  const { data: ses } = await supabase.auth.getSession();
                                  const tok = ses.session?.access_token;
                                  if (!tok) throw new Error('Not authenticated');
                                  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
                                  const res = await fetch(`${supabaseUrl}/functions/v1/marketplace-orders/orders/${ord.id}`, {
                                    method: 'PATCH', headers: { Authorization: `Bearer ${tok}`, 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ status: 'cancelled' }),
                                  });
                                  if (!res.ok) throw new Error('Failed');
                                  toast.success('Order cancelled');
                                  fetchAll();
                                } catch { toast.error('Failed to cancel'); }
                              }}><XCircle className="w-3.5 h-3.5" /></Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* ═══ USERS ═══ */}
          {activeTab === 'users' && <UserManagementTab />}

          {/* ═══ PAYOUTS ═══ */}
          {activeTab === 'payouts' && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Payout Requests</CardTitle>
                  <Button variant="outline" size="sm" onClick={exportPayouts}><Download className="w-3.5 h-3.5 mr-1" /> Export CSV</Button>
                </div>
              </CardHeader>
              <CardContent>
                {payouts.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No payout requests yet.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead><TableHead>Amount</TableHead><TableHead>Bank</TableHead>
                        <TableHead>Account</TableHead><TableHead>Status</TableHead><TableHead>Notes</TableHead>
                        <TableHead>Date</TableHead><TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payouts.map((pt) => (
                        <TableRow key={pt.id}>
                          <TableCell>{pt.profile?.full_name || '—'}</TableCell>
                          <TableCell className="font-medium">₦{Number(pt.amount).toLocaleString()}</TableCell>
                          <TableCell>{pt.bank_name}</TableCell>
                          <TableCell>{pt.account_name} / {pt.account_number}</TableCell>
                          <TableCell>
                            <Badge variant="secondary" className={pt.status === 'paid' ? 'bg-green-500/15 text-green-700' : pt.status === 'rejected' ? 'bg-red-500/15 text-red-700' : pt.status === 'processing' ? 'bg-blue-500/15 text-blue-700' : 'bg-yellow-500/15 text-yellow-700'}>{pt.status}</Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground max-w-[150px] truncate">{pt.admin_notes || '—'}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{new Date(pt.created_at).toLocaleDateString()}</TableCell>
                          <TableCell className="text-right">
                            {pt.status === 'pending' && (
                              <div className="flex justify-end gap-1">
                                <Button size="sm" variant="outline" className="text-green-600" onClick={() => setSelectedPayout(pt)}><CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Process</Button>
                                <Button size="sm" variant="outline" className="text-red-600" onClick={() => handlePayoutAction(pt.id, 'rejected')}><XCircle className="w-3.5 h-3.5 mr-1" /> Reject</Button>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          )}

          {/* ═══ PAYMENT GATEWAYS ═══ */}
          {activeTab === 'payment-gateways' && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2"><CreditCard className="w-5 h-5 text-secondary" /> Payment Gateway Configuration</CardTitle>
                  <Button onClick={savePaymentConfig} disabled={savingPaymentConfig} className="gap-1.5">
                    {savingPaymentConfig ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {savingPaymentConfig ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-6">Configure payment gateways for your marketplace. Settings apply globally.</p>
                {loadingPaymentConfig ? (
                  <div className="flex items-center justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-secondary" /></div>
                ) : (
                  <div className="space-y-8 max-w-2xl">
                    <div className="border rounded-lg p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <div><h3 className="font-semibold text-base">Paystack</h3><p className="text-xs text-muted-foreground">Nigeria, Ghana</p></div>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={paymentGateways.paystack?.enabled ?? true}
                            onChange={(e) => setPaymentGateways((prev) => ({ ...prev, paystack: { ...prev.paystack, enabled: e.target.checked, public_key: prev.paystack?.public_key || '', secret_key: prev.paystack?.secret_key || '' } }))}
                            className="rounded border-gray-300" />
                          <span className="text-sm">Enabled</span>
                        </label>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5"><Label className="text-xs">Public Key</Label>
                          <Input type="password" placeholder="pk_test_..." value={paymentGateways.paystack?.public_key || ''}
                            onChange={(e) => setPaymentGateways((prev) => ({ ...prev, paystack: { ...prev.paystack, public_key: e.target.value, secret_key: prev.paystack?.secret_key || '', enabled: prev.paystack?.enabled ?? true } }))}
                            className="font-mono text-xs" /></div>
                        <div className="space-y-1.5"><Label className="text-xs">Secret Key</Label>
                          <Input type="password" placeholder="sk_test_..." value={paymentGateways.paystack?.secret_key || ''}
                            onChange={(e) => setPaymentGateways((prev) => ({ ...prev, paystack: { ...prev.paystack, secret_key: e.target.value, public_key: prev.paystack?.public_key || '', enabled: prev.paystack?.enabled ?? true } }))}
                            className="font-mono text-xs" /></div>
                      </div>
                    </div>
                    <div className="border rounded-lg p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <div><h3 className="font-semibold text-base">Flutterwave</h3><p className="text-xs text-muted-foreground">Pan-Africa</p></div>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={paymentGateways.flutterwave?.enabled ?? false}
                            onChange={(e) => setPaymentGateways((prev) => ({ ...prev, flutterwave: { ...prev.flutterwave, enabled: e.target.checked, public_key: prev.flutterwave?.public_key || '', secret_key: prev.flutterwave?.secret_key || '' } }))}
                            className="rounded border-gray-300" />
                          <span className="text-sm">Enabled</span>
                        </label>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5"><Label className="text-xs">Public Key</Label>
                          <Input type="password" placeholder="FLWPUBK-..." value={paymentGateways.flutterwave?.public_key || ''}
                            onChange={(e) => setPaymentGateways((prev) => ({ ...prev, flutterwave: { ...prev.flutterwave, public_key: e.target.value, secret_key: prev.flutterwave?.secret_key || '', enabled: prev.flutterwave?.enabled ?? false } }))}
                            className="font-mono text-xs" /></div>
                        <div className="space-y-1.5"><Label className="text-xs">Secret Key</Label>
                          <Input type="password" placeholder="FLWSECK-..." value={paymentGateways.flutterwave?.secret_key || ''}
                            onChange={(e) => setPaymentGateways((prev) => ({ ...prev, flutterwave: { ...prev.flutterwave, secret_key: e.target.value, public_key: prev.flutterwave?.public_key || '', enabled: prev.flutterwave?.enabled ?? false } }))}
                            className="font-mono text-xs" /></div>
                      </div>
                    </div>
                    <Button variant="outline" onClick={loadPaymentConfig} disabled={loadingPaymentConfig}>
                      {loadingPaymentConfig ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />} Refresh
                    </Button>
                    <Separator className="my-6" />
                    <div className="space-y-4 max-w-2xl">
                      <h3 className="font-semibold text-base flex items-center gap-2"><Building2 className="w-4 h-4" /> Offline / Bank Transfer Payment</h3>
                      <p className="text-sm text-muted-foreground">Configure bank account details shown to buyers who choose to pay by bank transfer.</p>
                      {loadingOfflinePayment ? (
                        <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-secondary" /></div>
                      ) : (
                        <div className="space-y-3">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={offlinePayment.enabled} onChange={(e) => setOfflinePayment({ ...offlinePayment, enabled: e.target.checked })} className="rounded border-gray-300" />
                            <span className="text-sm">Enable bank transfer payments</span>
                          </label>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5"><Label className="text-xs">Bank Name</Label><Input placeholder="e.g. GTBank" value={offlinePayment.bank_name} onChange={(e) => setOfflinePayment({ ...offlinePayment, bank_name: e.target.value })} /></div>
                            <div className="space-y-1.5"><Label className="text-xs">Account Number</Label><Input placeholder="0123456789" value={offlinePayment.account_number} onChange={(e) => setOfflinePayment({ ...offlinePayment, account_number: e.target.value })} /></div>
                            <div className="space-y-1.5"><Label className="text-xs">Account Name</Label><Input placeholder="John Doe" value={offlinePayment.account_name} onChange={(e) => setOfflinePayment({ ...offlinePayment, account_name: e.target.value })} /></div>
                            <div className="space-y-1.5"><Label className="text-xs">Routing Number</Label><Input placeholder="Optional" value={offlinePayment.routing_number} onChange={(e) => setOfflinePayment({ ...offlinePayment, routing_number: e.target.value })} /></div>
                            <div className="space-y-1.5"><Label className="text-xs">SWIFT Code</Label><Input placeholder="Optional" value={offlinePayment.swift_code} onChange={(e) => setOfflinePayment({ ...offlinePayment, swift_code: e.target.value })} /></div>
                          </div>
                          <div className="space-y-1.5"><Label className="text-xs">Payment Instructions</Label>
                            <Textarea placeholder="Please make a transfer..." value={offlinePayment.instructions} onChange={(e) => setOfflinePayment({ ...offlinePayment, instructions: e.target.value })} rows={2} /></div>
                          <Button onClick={saveOfflinePaymentConfig} disabled={savingOfflinePayment} className="gap-1.5">
                            {savingOfflinePayment ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            {savingOfflinePayment ? 'Saving...' : 'Save Offline Config'}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* ═══ FEES ═══ */}
          {activeTab === 'service-fee' && (
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><DollarSign className="w-5 h-5 text-secondary" /> Service Fee Configuration</CardTitle></CardHeader>
              <CardContent className="max-w-lg">
                <p className="text-sm text-muted-foreground mb-6">Set the platform commission percentage deducted from each payment before release to the provider.</p>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Commission Percentage</Label>
                    <div className="flex items-center gap-3">
                      <Input type="number" min={0} max={100} step={0.5} value={serviceFeePct} onChange={(e) => setServiceFeePct(Number(e.target.value))} className="w-32 text-lg font-bold" />
                      <span className="text-lg font-semibold">%</span>
                    </div>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground">
                    <p className="font-medium text-foreground mb-1">Example</p>
                    <p>Order amount: ₦10,000 &rarr; Fee: ₦{(10000 * serviceFeePct / 100).toLocaleString()} &rarr; Provider receives: ₦{(10000 - 10000 * serviceFeePct / 100).toLocaleString()}</p>
                  </div>
                  <Button onClick={saveServiceFee} disabled={savingServiceFee} className="gap-1.5">
                    {savingServiceFee ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {savingServiceFee ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ═══ DISPUTES ═══ */}
          {activeTab === 'disputes' && (
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Scale className="w-5 h-5 text-secondary" /> Dispute Management</CardTitle></CardHeader>
              <CardContent>
                {disputedOrders.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No disputed orders. All is well.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow><TableHead>Service</TableHead><TableHead>Buyer</TableHead><TableHead>Provider</TableHead><TableHead>Amount</TableHead><TableHead>Date</TableHead><TableHead className="text-right">Actions</TableHead></TableRow>
                    </TableHeader>
                    <TableBody>
                      {disputedOrders.map((ord) => (
                        <TableRow key={ord.id}>
                          <TableCell className="max-w-[200px] truncate">{ord.listing?.title || '-'}</TableCell>
                          <TableCell>{ord.buyer?.full_name || '-'}</TableCell>
                          <TableCell>{ord.provider?.full_name || '-'}</TableCell>
                          <TableCell className="font-medium">₦{Number(ord.amount).toLocaleString()}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{new Date(ord.created_at).toLocaleDateString()}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button size="sm" variant="outline" className="text-green-600 border-green-200" disabled={resolvingDispute === ord.id} onClick={() => resolveDispute(ord.id, 'release')}>
                                {resolvingDispute === ord.id ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <CheckCircle2 className="w-3.5 h-3.5 mr-1" />} Release
                              </Button>
                              <Button size="sm" variant="outline" className="text-purple-600 border-purple-200" disabled={resolvingDispute === ord.id} onClick={() => resolveDispute(ord.id, 'refund')}>
                                {resolvingDispute === ord.id ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <XCircle className="w-3.5 h-3.5 mr-1" />} Refund
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          )}

          {/* ═══ AI SETTINGS ═══ */}
          {activeTab === 'ai-settings' && (
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Key className="w-5 h-5 text-secondary" /> AI Provider API Keys</CardTitle></CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-6">
                  Store API keys here instead of using <code className="bg-muted px-1.5 py-0.5 rounded text-xs">supabase secrets set</code>.
                  Keys saved here take precedence over environment variables. Changes apply on the next edge function cold start.
                </p>
                <div className="space-y-4 max-w-xl">
                  {Object.entries(AI_PROVIDER_LABELS).map(([key, label]) => (
                    <div key={key} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium">{label}</Label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={aiEnabled[key] ?? true} onChange={(e) => setAiEnabled((prev) => ({ ...prev, [key]: e.target.checked }))} className="rounded border-gray-300" />
                          <span className="text-xs">{aiEnabled[key] !== false ? 'Enabled' : 'Disabled'}</span>
                        </label>
                      </div>
                      <Input type="password" placeholder={`${label} API key...`} value={aiKeys[key]} onChange={(e) => setAiKeys((prev) => ({ ...prev, [key]: e.target.value }))} className="flex-1 font-mono text-xs" />
                    </div>
                  ))}
                  <div className="flex gap-2 pt-2">
                    <Button onClick={saveAiKeys} disabled={savingKeys} className="gap-1.5">
                      {savingKeys ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      {savingKeys ? 'Saving...' : 'Save all keys'}
                    </Button>
                    <Button variant="outline" onClick={loadAiKeys} disabled={loadingKeys}>{loadingKeys ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Refresh'}</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ═══ MANUAL PAYMENTS ═══ */}
          {activeTab === 'manual-payments' && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2"><Banknote className="w-5 h-5 text-secondary" /> Manual Payment Verification</CardTitle>
                  <Button variant="outline" size="sm" onClick={loadManualPayments} disabled={loadingManualPayments}>
                    {loadingManualPayments ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />} Refresh
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loadingManualPayments ? (
                  <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-secondary" /></div>
                ) : manualPayments.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No manual payments to verify.</p>
                ) : (
                  <div className="space-y-4">
                    {manualPayments.map((mp) => (
                      <Card key={mp.id} className={mp.status === 'pending' ? 'border-yellow-300' : ''}>
                        <CardContent className="pt-4">
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <p className="font-medium">₦{Number(mp.amount).toLocaleString()} — {mp.bank_name}</p>
                              <p className="text-sm text-muted-foreground">Buyer: {mp.buyer_id.slice(0, 8)}... | {new Date(mp.created_at).toLocaleString()}</p>
                              {mp.notes && <p className="text-sm text-muted-foreground italic">"{mp.notes}"</p>}
                            </div>
                            <Badge variant="secondary" className={mp.status === 'approved' ? 'bg-green-500/15 text-green-700' : mp.status === 'rejected' ? 'bg-red-500/15 text-red-700' : 'bg-yellow-500/15 text-yellow-700'}>{mp.status}</Badge>
                          </div>
                          {mp.screenshot_url && (
                            <div className="mt-3"><a href={mp.screenshot_url} target="_blank" rel="noopener noreferrer" className="text-xs text-secondary hover:underline inline-flex items-center gap-1"><ImageIcon className="w-3 h-3" /> View Screenshot</a></div>
                          )}
                          {mp.status === 'pending' && (
                            <div className="flex gap-2 mt-4">
                              <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleApproveManualPayment(mp.id)} disabled={processingManualPayment === mp.id}>
                                {processingManualPayment === mp.id ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <CheckCircle2 className="w-3.5 h-3.5 mr-1" />} Approve
                              </Button>
                              <Button size="sm" variant="outline" className="text-red-600" onClick={() => handleRejectManualPayment(mp.id)} disabled={processingManualPayment === mp.id}>
                                {processingManualPayment === mp.id ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <XCircle className="w-3.5 h-3.5 mr-1" />} Reject
                              </Button>
                            </div>
                          )}
                          {mp.admin_notes && <p className="text-xs text-muted-foreground mt-2">Admin note: {mp.admin_notes}</p>}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* ═══ SITE SETTINGS ═══ */}
          {activeTab === 'site-settings' && <SiteSettingsTab />}

          {/* ═══ VIDEO CALLS ═══ */}
          {activeTab === 'video-calls' && (
            <VideoCallsTab />
          )}

          {/* ═══ MESSAGES ═══ */}
          {activeTab === 'messages' && (
            <MessagesTab />
          )}

          {/* ═══ ORGANIZATIONS ═══ */}
          {activeTab === 'organizations' && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-secondary" />
                    Organization Management
                  </CardTitle>
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Search by name..."
                        className="pl-9 w-60"
                        value={orgSearch}
                        onChange={(e) => setOrgSearch(e.target.value)}
                      />
                    </div>
                    <Button variant="outline" size="sm" onClick={() => {
                      const csvData = orgs.map((o: any) => ({
                        Name: o.name,
                        Industry: o.industry || '—',
                        Size: o.size || '—',
                        Members: o.member_count ?? 0,
                        Plan: o.plan?.name || 'Free',
                        Created: new Date(o.created_at).toLocaleDateString(),
                      }));
                      downloadCSV(csvData, 'organizations');
                    }}>
                      <Download className="w-3.5 h-3.5 mr-1" /> Export CSV
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {orgsLoading ? (
                  <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-purple-600" /></div>
                ) : orgs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <Building2 className="w-12 h-12 text-gray-300 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">No Organizations Yet</h3>
                    <p className="text-sm text-muted-foreground max-w-md">
                      Organizations will appear here once users sign up and create one.
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Industry</TableHead>
                        <TableHead>Size</TableHead>
                        <TableHead>Members</TableHead>
                        <TableHead>Plan</TableHead>
                        <TableHead>Created</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orgs.map((org: any) => (
                        <TableRow key={org.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedOrg(org)}>
                          <TableCell className="font-medium text-purple-600 hover:underline">{org.name}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{org.industry || '—'}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{org.size || '—'}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{org.member_count ?? 0}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={org.plan ? 'default' : 'outline'}>
                              {org.plan?.name || 'Free'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {new Date(org.created_at).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          )}

          {/* ═══ VERIFICATIONS ═══ */}
          {activeTab === 'verifications' && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-secondary" />
                    Org Verification Queue
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    {['pending', 'verified', 'rejected'].map(s => (
                      <Button key={s} size="sm" variant={verifStatusFilter === s ? 'default' : 'outline'}
                        className={verifStatusFilter === s ? '' : 'text-muted-foreground'}
                        onClick={() => setVerifStatusFilter(s)}>
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {verificationsLoading ? (
                  <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-purple-600" /></div>
                ) : verifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <Shield className="w-12 h-12 text-gray-300 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">No {verifStatusFilter} verifications</h3>
                    <p className="text-sm text-muted-foreground max-w-md">
                      {verifStatusFilter === 'pending' ? 'No organizations have submitted verification requests yet.' : ''}
                      {verifStatusFilter === 'verified' ? 'No verified submissions match this filter.' : ''}
                      {verifStatusFilter === 'rejected' ? 'No rejected submissions match this filter.' : ''}
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Organization</TableHead>
                        <TableHead>Business Name</TableHead>
                        <TableHead>Reg Number</TableHead>
                        <TableHead>Tax ID</TableHead>
                        <TableHead>Documents</TableHead>
                        <TableHead>Submitted</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {verifications.map((v: any) => (
                        <TableRow key={v.id}>
                          <TableCell className="font-medium">{v.organization?.name || v.org_id?.slice(0, 8) || '—'}</TableCell>
                          <TableCell className="text-sm">{v.business_name || '—'}</TableCell>
                          <TableCell className="text-sm font-mono">{v.registration_number || '—'}</TableCell>
                          <TableCell className="text-sm font-mono">{v.tax_id || '—'}</TableCell>
                          <TableCell>
                            {v.document_urls?.length > 0 ? (
                              <div className="flex gap-1">
                                {v.document_urls.map((url: string, i: number) => (
                                  <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                                    className="text-xs text-purple-600 hover:underline flex items-center gap-0.5">
                                    <FileText className="w-3 h-3" /> Doc {i + 1}
                                  </a>
                                ))}
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {new Date(v.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            {v.status === 'pending' && (
                              <div className="flex items-center justify-end gap-1">
                                <Button size="sm" className="h-7 text-xs bg-green-600 hover:bg-green-700"
                                  onClick={() => { setReviewingVerification(v); setReviewingStatus('verified'); setReviewDialogOpen(true); }}>
                                  <CheckCircle2 className="w-3 h-3 mr-0.5" /> Approve
                                </Button>
                                <Button size="sm" variant="outline" className="h-7 text-xs text-red-600"
                                  onClick={() => { setReviewingVerification(v); setReviewingStatus('rejected'); setReviewDialogOpen(true); }}>
                                  <XCircle className="w-3 h-3 mr-0.5" /> Reject
                                </Button>
                              </div>
                            )}
                            {v.status === 'verified' && (
                              <Badge variant="default" className="text-xs bg-green-100 text-green-800 border-green-200">Verified</Badge>
                            )}
                            {v.status === 'rejected' && (
                              <Badge variant="outline" className="text-xs text-red-600 border-red-200">Rejected</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          )}

          {/* ═══ PLANS ═══ */}
          {activeTab === 'plans' && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-secondary" />
                    Subscription Plans
                  </CardTitle>
                  <Button size="sm" onClick={() => { setEditingPlan(null); resetPlanForm(); setPlanDialogOpen(true); }}>
                    <CreditCard className="w-3.5 h-3.5 mr-1" /> Create Plan
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {plansLoading ? (
                  <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-purple-600" /></div>
                ) : plans.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <CreditCard className="w-12 h-12 text-gray-300 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">No Plans Yet</h3>
                    <p className="text-sm text-muted-foreground max-w-md">Create your first subscription plan.</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Slug</TableHead>
                        <TableHead>Monthly</TableHead>
                        <TableHead>Yearly</TableHead>
                        <TableHead>Features</TableHead>
                        <TableHead>Active</TableHead>
                        <TableHead>Sort</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {plans.map((plan: any) => (
                        <TableRow key={plan.id} className={plan.is_active ? '' : 'opacity-50'}>
                          <TableCell className="font-medium">{plan.name}</TableCell>
                          <TableCell className="text-sm font-mono text-muted-foreground">{plan.slug}</TableCell>
                          <TableCell>${Number(plan.price_monthly).toFixed(2)}</TableCell>
                          <TableCell>${Number(plan.price_yearly).toFixed(2)}</TableCell>
                          <TableCell className="max-w-[200px]">
                            <div className="flex flex-wrap gap-1">
                              {(plan.features || []).slice(0, 3).map((f: string, i: number) => (
                                <Badge key={i} variant="secondary" className="text-xs">{f}</Badge>
                              ))}
                              {(plan.features || []).length > 3 && (
                                <Badge variant="outline" className="text-xs">+{plan.features.length - 3}</Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button size="sm" variant={plan.is_active ? 'default' : 'outline'} className="h-6 text-xs px-2"
                              onClick={() => handleTogglePlanActive(plan)}>
                              {plan.is_active ? 'Active' : 'Inactive'}
                            </Button>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">{plan.sort_order}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button size="sm" variant="ghost" className="h-7 w-7 p-0"
                                onClick={() => { setEditingPlan(plan); resetPlanForm(plan); setPlanDialogOpen(true); }}>
                                <Settings className="w-3.5 h-3.5" />
                              </Button>
                              <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-500"
                                onClick={() => handleDeletePlan(plan)}>
                                <XCircle className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          )}

          {/* ═══ CONTRACTS ═══ */}
          {activeTab === 'contracts' && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-secondary" />
                    Contracts
                  </CardTitle>
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                      <Input placeholder="Search by title..." className="pl-9 w-56"
                        value={contractSearchInput}
                        onChange={e => setContractSearchInput(e.target.value)} />
                    </div>
                    <select className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                      value={contractStatusFilter} onChange={e => setContractStatusFilter(e.target.value)}>
                      <option value="">All statuses</option>
                      <option value="draft">Draft</option>
                      <option value="sent">Sent</option>
                      <option value="signed">Signed</option>
                      <option value="active">Active</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {contractsLoading ? (
                  <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-purple-600" /></div>
                ) : contracts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <FileText className="w-12 h-12 text-gray-300 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">No Contracts Found</h3>
                    <p className="text-sm text-muted-foreground max-w-md">No contracts match your current filters.</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Organization</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Talent</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Value</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {contracts.map((c: any) => (
                        <TableRow key={c.id}>
                          <TableCell className="font-medium text-sm">{c.organization?.name || c.org_id?.slice(0, 8)}</TableCell>
                          <TableCell className="text-sm max-w-[200px] truncate">{c.title}</TableCell>
                          <TableCell className="text-sm">{c.talent?.full_name || '—'}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{c.contract_type?.replace(/_/g, ' ')}</TableCell>
                          <TableCell className="text-sm font-medium">
                            {c.currency || 'NGN'} {Number(c.total_value || 0).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Badge variant={
                              c.status === 'active' || c.status === 'completed' ? 'default' :
                              c.status === 'draft' || c.status === 'sent' ? 'secondary' :
                              c.status === 'cancelled' ? 'outline' : 'secondary'
                            }
                              className={`text-xs ${
                                c.status === 'completed' ? 'bg-green-100 text-green-800 border-green-200' :
                                c.status === 'active' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                                c.status === 'cancelled' ? 'text-red-600 border-red-200' : ''
                              }`}>
                              {c.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {new Date(c.created_at).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          )}

          {/* ═══ ORG DETAIL SHEET ═══ */}
          <Sheet open={!!selectedOrg} onOpenChange={(open) => { if (!open) setSelectedOrg(null); }}>
            <SheetContent className="sm:max-w-md w-full overflow-y-auto">
              <SheetHeader className="pb-4 border-b">
                <SheetTitle className="flex items-center gap-2 text-lg">
                  <Building2 className="w-5 h-5 text-secondary" />
                  {selectedOrg?.name || 'Organization'}
                </SheetTitle>
                <SheetDescription>
                  {selectedOrg?.slug && <span className="text-xs font-mono">/{selectedOrg.slug}</span>}
                </SheetDescription>
              </SheetHeader>

              {selectedOrg && (
                <div className="flex flex-col gap-5 py-4">
                  {/* Status badge */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">Status</span>
                    <Badge variant={selectedOrg.status === 'active' ? 'default' : 'secondary'}>
                      {selectedOrg.status || 'active'}
                    </Badge>
                  </div>

                  {/* Industry & Size */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Industry</span>
                      <p className="text-sm font-medium mt-1">{selectedOrg.industry || '—'}</p>
                    </div>
                    <div>
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Size</span>
                      <p className="text-sm font-medium mt-1">{selectedOrg.size || '—'}</p>
                    </div>
                  </div>

                  {/* Description */}
                  {selectedOrg.description && (
                    <div>
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Description</span>
                      <p className="text-sm mt-1 text-gray-700 leading-relaxed">{selectedOrg.description}</p>
                    </div>
                  )}

                  <Separator />

                  {/* Plan & Members */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Plan</span>
                      <div className="mt-1">
                        <Badge variant={selectedOrg.plan ? 'default' : 'outline'}>
                          {selectedOrg.plan?.name || 'Free'}
                        </Badge>
                      </div>
                      {selectedOrg.plan && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {selectedOrg.plan.interval === 'month' ? 'Monthly' : 'Yearly'} · ${Number(selectedOrg.plan.price).toFixed(2)}
                        </p>
                      )}
                    </div>
                    <div>
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Members</span>
                      <p className="text-lg font-semibold mt-1">{selectedOrg.member_count ?? 0}</p>
                    </div>
                  </div>

                  {/* Subscription Status */}
                  {selectedOrg.subscription_status && (
                    <div>
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Subscription</span>
                      <Badge className="mt-1" variant={selectedOrg.subscription_status === 'active' ? 'default' : 'secondary'}>
                        {selectedOrg.subscription_status}
                      </Badge>
                    </div>
                  )}

                  <Separator />

                  {/* Website */}
                  {selectedOrg.website_url && (
                    <div>
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Website</span>
                      <a href={selectedOrg.website_url} target="_blank" rel="noopener noreferrer"
                         className="flex items-center gap-1.5 text-sm text-purple-600 hover:underline mt-1">
                        <ExternalLink className="w-3.5 h-3.5" />
                        {selectedOrg.website_url}
                      </a>
                    </div>
                  )}

                  {/* Created */}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-3.5 h-3.5" />
                    Created {new Date(selectedOrg.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </div>
                </div>
              )}
            </SheetContent>
          </Sheet>

          {/* ═══ REVIEW VERIFICATION DIALOG ═══ */}
          <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-secondary" />
                  {reviewingStatus === 'verified' ? 'Approve' : 'Reject'} Verification
                </DialogTitle>
              </DialogHeader>
              {reviewingVerification && (
                <div className="space-y-3 pt-2">
                  <div className="text-sm space-y-1">
                    <p><span className="text-muted-foreground">Org:</span> {reviewingVerification.organization?.name || '—'}</p>
                    <p><span className="text-muted-foreground">Business:</span> {reviewingVerification.business_name || '—'}</p>
                    <p><span className="text-muted-foreground">Reg #:</span> {reviewingVerification.registration_number || '—'}</p>
                  </div>
                  <Separator />
                  <div>
                    <Label>Review Notes</Label>
                    <Textarea
                      value={reviewNotes}
                      onChange={(e) => setReviewNotes(e.target.value)}
                      placeholder="Optional notes about this decision..."
                      rows={3}
                    />
                  </div>
                  <DialogFooter className="gap-2 pt-2">
                    <Button variant="outline" onClick={() => setReviewDialogOpen(false)} disabled={reviewProcessing}>
                      Cancel
                    </Button>
                    <Button
                      className={reviewingStatus === 'verified' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
                      onClick={handleReviewVerification}
                      disabled={reviewProcessing}
                    >
                      {reviewProcessing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                      {reviewingStatus === 'verified' ? 'Approve' : 'Reject'}
                    </Button>
                  </DialogFooter>
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* ═══ PLAN DIALOG ═══ */}
          <Dialog open={planDialogOpen} onOpenChange={setPlanDialogOpen}>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-secondary" />
                  {editingPlan ? 'Edit Plan' : 'Create Plan'}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Name *</Label>
                    <Input value={planForm.name} onChange={e => setPlanForm(p => ({ ...p, name: e.target.value }))} placeholder="Pro Plan" />
                  </div>
                  <div>
                    <Label>Slug *</Label>
                    <Input value={planForm.slug} onChange={e => setPlanForm(p => ({ ...p, slug: e.target.value }))} placeholder="pro" />
                  </div>
                </div>
                <div>
                  <Label>Description</Label>
                  <Input value={planForm.description} onChange={e => setPlanForm(p => ({ ...p, description: e.target.value }))} placeholder="Best for growing teams" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Monthly Price ($)</Label>
                    <Input type="number" min={0} step={0.01} value={planForm.price_monthly}
                      onChange={e => setPlanForm(p => ({ ...p, price_monthly: parseFloat(e.target.value) || 0 }))} />
                  </div>
                  <div>
                    <Label>Yearly Price ($)</Label>
                    <Input type="number" min={0} step={0.01} value={planForm.price_yearly}
                      onChange={e => setPlanForm(p => ({ ...p, price_yearly: parseFloat(e.target.value) || 0 }))} />
                  </div>
                </div>
                <div>
                  <Label>Features (comma-separated)</Label>
                  <Textarea value={planForm.features} onChange={e => setPlanForm(p => ({ ...p, features: e.target.value }))}
                    placeholder="Up to 10 team members, Priority support, Custom domain" rows={2} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Sort Order</Label>
                    <Input type="number" min={0} step={1} value={planForm.sort_order}
                      onChange={e => setPlanForm(p => ({ ...p, sort_order: parseInt(e.target.value) || 0 }))} />
                  </div>
                  <div className="flex items-end pb-1">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={planForm.is_active}
                        onChange={e => setPlanForm(p => ({ ...p, is_active: e.target.checked }))}
                        className="rounded border-gray-300 text-purple-600 focus:ring-purple-500" />
                      <span className="text-sm font-medium">Active</span>
                    </label>
                  </div>
                </div>
                <DialogFooter className="pt-2 gap-2">
                  <Button variant="outline" onClick={() => setPlanDialogOpen(false)} disabled={savingPlan}>Cancel</Button>
                  <Button onClick={handleSavePlan} disabled={!planForm.name.trim() || !planForm.slug.trim() || savingPlan}>
                    {savingPlan ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    {editingPlan ? 'Update Plan' : 'Create Plan'}
                  </Button>
                </DialogFooter>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        
        {/* Footer */}
        <footer className="bg-gray-900 text-gray-300 py-12 px-6 mt-8">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
              <div className="col-span-1 md:col-span-2">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold text-black">SBA</span>
                  </div>
                  <span className="font-bold text-lg text-white">SkillBridge Africa</span>
                </div>
                <p className="text-sm text-gray-400 max-w-sm mb-4">
                  Empowering the next generation of African digital talent through learning, mentorship and innovation.
                </p>
              </div>
              
              <div>
                <h4 className="text-white font-semibold mb-4">Links</h4>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li><a href="#" className="hover:text-white transition-colors">Programs</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Community</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Company</a></li>
                </ul>
              </div>

              <div>
                <h4 className="text-white font-semibold mb-4">Newsletter</h4>
                <div className="flex gap-2">
                  <Input type="email" placeholder="Email Address" className="bg-gray-800 border-gray-700 text-white" />
                  <Button className="bg-purple-600 hover:bg-purple-700">Subscribe</Button>
                </div>
              </div>
            </div>
            
            <div className="pt-8 border-t border-gray-800 text-sm text-gray-500 text-center">
              © 2025 SkillBridge Africa. All Rights Reserved.
            </div>
          </div>
        </footer>
      </div>

      {/* Edit Service Dialog */}
      <Dialog open={!!editingService} onOpenChange={(o) => !o && setEditingService(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Service</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2"><Label>Name</Label><Input value={editName} onChange={(e) => setEditName(e.target.value)} /></div>
            <div className="space-y-2"><Label>Description</Label><Textarea value={editDesc} onChange={(e) => setEditDesc(e.target.value)} /></div>
            <div className="space-y-2"><Label>Base Price (₦)</Label><Input type="number" value={editPrice} onChange={(e) => setEditPrice(Number(e.target.value))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingService(null)}>Cancel</Button>
            <Button onClick={saveService}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Process Payout Dialog */}
      <Dialog open={!!selectedPayout} onOpenChange={(o) => !o && setSelectedPayout(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Process Payout</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm">Pay <strong>₦{Number(selectedPayout?.amount || 0).toLocaleString()}</strong> to <strong>{selectedPayout?.account_name}</strong> at <strong>{selectedPayout?.bank_name}</strong> ({selectedPayout?.account_number})</p>
            <div className="space-y-2"><Label>Admin Notes</Label><Textarea placeholder="Optional notes about this payout..." value={payoutNotes} onChange={(e) => setPayoutNotes(e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedPayout(null)}>Cancel</Button>
            <Button className="bg-green-600 hover:bg-green-700" disabled={processingPayout} onClick={() => handlePayoutAction(selectedPayout!.id, 'paid')}>
              {processingPayout ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />} Mark as Paid
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function VideoCallsTab() {
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [ending, setEnding] = useState<string | null>(null);

  const loadRooms = useCallback(async () => {
    setLoading(true);
    try {
      const res = await get<any[]>('/video-call/admin/rooms');
      setRooms(res.data || []);
    } catch (e: any) {
      toast.error(e.message || 'Failed to load rooms');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRooms();
    const interval = setInterval(loadRooms, 10000);
    return () => clearInterval(interval);
  }, [loadRooms]);

  const handleEndRoom = async (roomId: string) => {
    setEnding(roomId);
    try {
      await post(`/video-call/admin/rooms/${encodeURIComponent(roomId)}/end`, { reason: 'Ended by admin' });
      toast.success(`Room ${roomId} ended`);
      setRooms((prev) => prev.filter((r) => r.id !== roomId));
    } catch (e: any) {
      toast.error(e.message || 'Failed to end room');
    } finally {
      setEnding(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2"><Video className="w-5 h-5 text-secondary" /> Active Video Calls</CardTitle>
          <Button variant="outline" size="sm" onClick={loadRooms} disabled={loading}>
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />} Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading && rooms.length === 0 ? (
          <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-secondary" /></div>
        ) : rooms.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No active video calls.</p>
        ) : (
          <div className="space-y-3">
            {rooms.map((room) => (
              <div key={room.id} className="border rounded-lg p-4 flex items-center justify-between">
                <div className="space-y-1">
                  <p className="font-mono text-sm font-medium">{room.id}</p>
                  <p className="text-xs text-muted-foreground">
                    {room.peerCount} participant{room.peerCount !== 1 ? 's' : ''} &middot;{' '}
                    {new Date(room.createdAt).toLocaleString()}
                  </p>
                  {room.peers && room.peers.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {room.peers.map((peer: any) => (
                        <Badge key={peer.id} variant="secondary" className="text-xs">{peer.displayName}</Badge>
                      ))}
                    </div>
                  )}
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={ending === room.id}
                  onClick={() => handleEndRoom(room.id)}
                >
                  {ending === room.id ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <XCircle className="w-3.5 h-3.5 mr-1" />}
                  End Call
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function MessagesTab() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedConvo, setSelectedConvo] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const loadConversations = useCallback(async () => {
    setLoading(true);
    try {
      const res = await get<any[]>('/admin/conversations');
      setConversations(res.data || []);
    } catch (e: any) {
      setConversations([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const openConversation = async (conversationId: string) => {
    setSelectedConvo(conversationId);
    setLoadingMessages(true);
    try {
      const res = await get<any[]>(`/messages/${encodeURIComponent(conversationId)}`);
      setMessages(res.data || []);
    } catch (e: any) {
      toast.error(e.message || 'Failed to load messages');
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2"><MessageSquare className="w-5 h-5 text-secondary" /> Messages</CardTitle>
          <Button variant="outline" size="sm" onClick={loadConversations} disabled={loading}>
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />} Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border rounded-lg md:col-span-1 max-h-[500px] overflow-y-auto">
            {loading && conversations.length === 0 ? (
              <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-secondary" /></div>
            ) : conversations.length === 0 ? (
              <p className="text-muted-foreground text-center py-8 text-sm">No conversations.</p>
            ) : (
              <div className="divide-y">
                {conversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => openConversation(conv.id)}
                    className={`w-full text-left px-3 py-2.5 text-sm hover:bg-muted/50 transition-colors ${
                      selectedConvo === conv.id ? 'bg-muted' : ''
                    }`}
                  >
                    <p className="font-medium truncate">{conv.subject || conv.id}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {conv.last_message?.sender_name || conv.last_message?.content?.slice(0, 60) || 'No messages'}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="border rounded-lg md:col-span-2 max-h-[500px] overflow-y-auto p-4 space-y-3">
            {!selectedConvo ? (
              <p className="text-muted-foreground text-center py-8 text-sm">Select a conversation to view messages.</p>
            ) : loadingMessages ? (
              <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-secondary" /></div>
            ) : messages.length === 0 ? (
              <p className="text-muted-foreground text-center py-8 text-sm">No messages in this conversation.</p>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className="flex items-start gap-2">
                  <Avatar className="w-7 h-7">
                    <AvatarFallback className="text-xs">{(msg.sender_name || 'U')[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{msg.sender_name || 'Unknown'}</span>
                      <span className="text-xs text-muted-foreground">{new Date(msg.created_at || msg.timestamp).toLocaleString()}</span>
                    </div>
                    <p className="text-sm mt-0.5 whitespace-pre-wrap break-words">{msg.content}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

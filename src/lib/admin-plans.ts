import { supabase } from '@/integrations/supabase/client';

export interface SubscriptionPlan {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price_monthly: number;
  price_yearly: number;
  max_members: number;
  max_active_jobs: number;
  features: Record<string, boolean>;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export async function getPlans(): Promise<SubscriptionPlan[]> {
  const { data, error } = await supabase
    .from('subscription_plans')
    .select('*')
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function createPlan(plan: Omit<SubscriptionPlan, 'id' | 'created_at' | 'updated_at'>): Promise<SubscriptionPlan> {
  const { data, error } = await supabase
    .from('subscription_plans')
    .insert(plan)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updatePlan(id: string, plan: Partial<Omit<SubscriptionPlan, 'id' | 'created_at' | 'updated_at'>>): Promise<SubscriptionPlan> {
  const { data, error } = await supabase
    .from('subscription_plans')
    .update({ ...plan, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deletePlan(id: string): Promise<void> {
  const { error } = await supabase
    .from('subscription_plans')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

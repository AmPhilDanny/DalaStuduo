// ============================================================
// Admin Configuration API — read/write platform_config values
// All calls use the admin's auth session token
// ============================================================

import { supabase } from '@/integrations/supabase/client';

// ── Types ──

export type AiProviderName = 'openrouter' | 'openai' | 'mistral' | 'groq' | 'google' | 'togetherai';

export interface AiProviderConfig {
  provider: AiProviderName;
  apiKey: string;
  model: string;
  label: string;
}

export interface GitHubOAuthConfig {
  clientId: string;
  clientSecret: string;
  encryptionKey: string;
}

export interface EmailConfig {
  resendApiKey: string;
}

export interface PaymentConfig {
  paystackSecretKey: string;
  flutterwaveSecretKey: string;
  flutterwaveEncryptionKey: string;
}

export interface PlatformConfigValue {
  key: string;
  value: unknown;
  description: string;
  isPublic: boolean;
}

// ── API Client ──

async function configFetch<T>(method: string, body?: Record<string, unknown>): Promise<T> {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) throw new Error('Please sign in');

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const res = await fetch(`${supabaseUrl}/functions/v1/admin-api/config`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.error || `Config API error: ${res.statusText}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

// ── Config Operations ──

/** Get all config values from platform_config */
export async function getConfig(): Promise<Record<string, unknown>> {
  const { data, error } = await supabase
    .from('platform_config')
    .select('key, value')
    .order('key');

  if (error) throw error;
  const config: Record<string, unknown> = {};
  for (const row of data || []) {
    config[row.key] = row.value;
  }
  return config;
}

/** Set a single config value */
export async function setConfigValue(key: string, value: unknown): Promise<void> {
  const { error } = await supabase
    .from('platform_config')
    .upsert({ key, value }, { onConflict: 'key' });

  if (error) throw error;
}

/** Bulk set config values */
export async function setConfigValues(entries: { key: string; value: unknown }[]): Promise<void> {
  const { error } = await supabase
    .from('platform_config')
    .upsert(entries, { onConflict: 'key' });

  if (error) throw error;
}

/** Save all AI provider configs to platform_config */
export async function saveAiConfig(providers: AiProviderConfig[]): Promise<void> {
  const entries = providers.map((p) => ({
    key: `ai_provider_${p.provider}`,
    value: { apiKey: p.apiKey, model: p.model, label: p.label },
  }));
  // Also store the active provider
  entries.push({ key: 'ai_active_provider', value: providers.find((p) => p.apiKey)?.provider || 'openrouter' });
  await setConfigValues(entries);
}

/** Get AI provider configs from platform_config */
export async function getAiConfig(): Promise<Record<string, { apiKey: string; model: string; label: string }>> {
  const { data, error } = await supabase
    .from('platform_config')
    .select('key, value')
    .in('key', [
      'ai_provider_openrouter', 'ai_provider_openai', 'ai_provider_mistral',
      'ai_provider_groq', 'ai_provider_google', 'ai_provider_togetherai',
    ]);

  if (error) throw error;
  const config: Record<string, { apiKey: string; model: string; label: string }> = {};
  for (const row of data || []) {
    config[row.key.replace('ai_provider_', '')] = row.value as { apiKey: string; model: string; label: string };
  }
  return config;
}

/** Get secrets that should be synced to Supabase (for edge functions) */
export async function getSecretsToDeploy(): Promise<Record<string, string>> {
  const config = await getConfig();
  const secrets: Record<string, string> = {};

  // AI
  for (const provider of ['openrouter', 'openai', 'mistral', 'groq', 'google', 'togetherai']) {
    const cfg = config[`ai_provider_${provider}`] as { apiKey?: string; model?: string } | undefined;
    if (cfg?.apiKey) {
      const key = `${provider.toUpperCase()}_API_KEY`;
      secrets[key] = cfg.apiKey;
      if (cfg.model) {
        secrets[`${provider.toUpperCase()}_MODEL`] = cfg.model;
      }
    }
  }

  // GitHub
  const gh = config['github_oauth'] as GitHubOAuthConfig | undefined;
  if (gh?.clientId) secrets['GITHUB_CLIENT_ID'] = gh.clientId;
  if (gh?.clientSecret) secrets['GITHUB_CLIENT_SECRET'] = gh.clientSecret;
  if (gh?.encryptionKey) secrets['GITHUB_TOKEN_ENCRYPTION_KEY'] = gh.encryptionKey;

  // Email
  const email = config['email_resend'] as EmailConfig | undefined;
  if (email?.resendApiKey) secrets['RESEND_API_KEY'] = email.resendApiKey;

  // Payments
  const pmt = config['payment_gateways'] as PaymentConfig | undefined;
  if (pmt?.paystackSecretKey) secrets['PAYSTACK_SECRET_KEY'] = pmt.paystackSecretKey;
  if (pmt?.flutterwaveSecretKey) secrets['FLUTTERWAVE_SECRET_KEY'] = pmt.flutterwaveSecretKey;
  if (pmt?.flutterwaveEncryptionKey) secrets['FLUTTERWAVE_ENCRYPTION_KEY'] = pmt.flutterwaveEncryptionKey;

  return secrets;
}

/** Deploy secrets to Supabase (requires service_role access) */
export async function deploySecrets(secrets: Record<string, string>): Promise<void> {
  // This calls a management edge function or uses the Supabase Management API
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) throw new Error('Please sign in');

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const res = await fetch(`${supabaseUrl}/functions/v1/admin-api/config/deploy`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ secrets }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.error || 'Deploy failed');
  }
}

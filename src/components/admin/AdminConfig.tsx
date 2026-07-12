import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Loader2, CheckCircle, XCircle, Eye, EyeOff,
  Brain, Github, Mail, CreditCard, Settings, Upload, ExternalLink, Save, Banknote, Percent,
} from 'lucide-react';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  getConfig, setConfigValue, getSecretsToDeploy,
} from '@/lib/admin-config';

// ── Types ──
interface ConfigState {
  loading: boolean;
  saving: boolean;
  data: Record<string, unknown>;
}

interface SectionProps {
  title: string;
  icon: React.ReactNode;
  description: string;
  children: React.ReactNode;
}

function ConfigSection({ title, icon, description, children }: SectionProps) {
  return (
    <Card className="border-l-4 border-l-purple-500">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          {icon}
          {title}
        </CardTitle>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {children}
      </CardContent>
    </Card>
  );
}

function SecretInput({ value, onChange, placeholder, label }: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  label?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="space-y-1.5">
      {label && <Label className="text-xs">{label}</Label>}
      <div className="relative">
        <Input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || '••••••••••••••••'}
          className="pr-9 font-mono text-xs"
        />
        <button
          type="button"
          onClick={() => setShow(!show)}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

// ── AI Provider Config ──

const AI_PROVIDERS = [
  { value: 'openrouter', label: 'OpenRouter', defaultModel: 'google/gemini-2.0-flash-001' },
  { value: 'openai', label: 'OpenAI', defaultModel: 'gpt-4o-mini' },
  { value: 'mistral', label: 'Mistral', defaultModel: 'mistral-small-latest' },
  { value: 'groq', label: 'Groq', defaultModel: 'mixtral-8x7b-32768' },
  { value: 'google', label: 'Google AI', defaultModel: 'gemini-2.0-flash-001' },
  { value: 'togetherai', label: 'Together AI', defaultModel: 'mistralai/Mixtral-8x7B-Instruct-v0.1' },
];

function AiConfig({ config, onSave }: { config: ConfigState; onSave: (entries: { key: string; value: unknown }[]) => Promise<void> }) {
  const [providers, setProviders] = useState<Record<string, { apiKey: string; model: string }>>({});
  const [activeProvider, setActiveProvider] = useState('openrouter');
  const [saving, setSaving] = useState(false);
  const [testResult, setTestResult] = useState<'idle' | 'testing' | 'ok' | 'fail'>('idle');

  useEffect(() => {
    if (config.data.ai_active_provider) setActiveProvider(String(config.data.ai_active_provider));
    const loaded: Record<string, { apiKey: string; model: string }> = {};
    for (const p of AI_PROVIDERS) {
      const stored = config.data[`ai_provider_${p.value}`] as { apiKey?: string; model?: string } | undefined;
      loaded[p.value] = {
        apiKey: stored?.apiKey || '',
        model: stored?.model || p.defaultModel,
      };
    }
    setProviders(loaded);
  }, [config.data]);

  async function handleSave() {
    setSaving(true);
    try {
      const entries = Object.entries(providers).map(([provider, cfg]) => ({
        key: `ai_provider_${provider}`,
        value: cfg,
      }));
      entries.push({ key: 'ai_active_provider', value: activeProvider });
      await onSave(entries);
      toast.success('AI config saved');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  async function handleTest() {
    setTestResult('testing');
    // Simulate a test call — real test would go through ai-assist edge function
    const active = providers[activeProvider];
    if (!active?.apiKey) {
      toast.error('Set an API key for the active provider first');
      setTestResult('fail');
      return;
    }
    setTimeout(() => {
      setTestResult('ok');
      toast.success('AI provider responds (simulated — real test when deployed)');
    }, 1000);
  }

  return (
    <ConfigSection title="AI Provider" icon={<Brain className="w-5 h-5 text-purple-500" />} description="Configure AI providers used by ai-assist edge function for insights, summaries, and chat.">
      <div className="space-y-2">
        <Label className="text-xs">Active Provider</Label>
        <Select value={activeProvider} onValueChange={setActiveProvider}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {AI_PROVIDERS.map((p) => (
              <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {AI_PROVIDERS.map((p) => (
        <div key={p.value} className={`p-3 rounded-lg border ${activeProvider === p.value ? 'border-purple-500/30 bg-purple-50 dark:bg-purple-950/20' : 'border-border'} space-y-2`}>
          <div className="flex items-center justify-between">
            <Label className="text-xs font-semibold">{p.label}</Label>
            {activeProvider === p.value && <Badge variant="default" className="text-[10px]">Active</Badge>}
          </div>
          <SecretInput
            label="API Key"
            value={providers[p.value]?.apiKey || ''}
            onChange={(v) => setProviders((prev) => ({ ...prev, [p.value]: { ...prev[p.value], apiKey: v, model: prev[p.value]?.model || p.defaultModel } }))}
            placeholder={`${p.label} API key`}
          />
          <div className="space-y-1.5">
            <Label className="text-xs">Model</Label>
            <Input
              value={providers[p.value]?.model || p.defaultModel}
              onChange={(e) => setProviders((prev) => ({ ...prev, [p.value]: { ...prev[p.value], apiKey: prev[p.value]?.apiKey || '', model: e.target.value } }))}
              className="font-mono text-xs"
              placeholder={p.defaultModel}
            />
          </div>
        </div>
      ))}

      <div className="flex gap-3 pt-2">
        <Button onClick={handleSave} disabled={saving} className="flex-1">
          {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
          Save AI Config
        </Button>
        <Button variant="outline" onClick={handleTest} disabled={testResult === 'testing'}>
          {testResult === 'testing' ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : testResult === 'ok' ? <CheckCircle className="w-4 h-4 mr-2 text-green-500" /> : testResult === 'fail' ? <XCircle className="w-4 h-4 mr-2 text-red-500" /> : null}
          Test
        </Button>
      </div>

      <details className="text-xs text-muted-foreground border rounded-lg p-3">
        <summary className="cursor-pointer font-medium">Setup Instructions</summary>
        <ol className="mt-2 space-y-1 list-decimal list-inside">
          <li>Get an API key from your chosen provider's dashboard</li>
          <li>Select that provider as "Active"</li>
          <li>Paste the key and optionally change the model</li>
          <li>Click "Save AI Config" to store in platform_config</li>
          <li>Click "Deploy Secrets" below to sync to Supabase edge functions</li>
        </ol>
      </details>
    </ConfigSection>
  );
}

// ── GitHub OAuth Config ──

function GitHubConfig({ config, onSave }: { config: ConfigState; onSave: (entries: { key: string; value: unknown }[]) => Promise<void> }) {
  const [gh, setGh] = useState({ clientId: '', clientSecret: '', encryptionKey: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const stored = config.data.github_oauth as { clientId?: string; clientSecret?: string; encryptionKey?: string } | undefined;
    setGh({
      clientId: stored?.clientId || '',
      clientSecret: stored?.clientSecret || '',
      encryptionKey: stored?.encryptionKey || '',
    });
  }, [config.data]);

  async function handleSave() {
    setSaving(true);
    try {
      await onSave([{ key: 'github_oauth', value: gh }]);
      toast.success('GitHub config saved');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  return (
    <ConfigSection title="GitHub OAuth" icon={<Github className="w-5 h-5 text-gray-500 dark:text-gray-400" />} description="Configure GitHub OAuth for the Code Playground integration (repository browsing, commits).">
      <SecretInput label="Client ID" value={gh.clientId} onChange={(v) => setGh((p) => ({ ...p, clientId: v }))} placeholder="Iv1.xxxxxxxxxxxx" />
      <SecretInput label="Client Secret" value={gh.clientSecret} onChange={(v) => setGh((p) => ({ ...p, clientSecret: v }))} />
      <SecretInput label="Token Encryption Key" value={gh.encryptionKey} onChange={(v) => setGh((p) => ({ ...p, encryptionKey: v }))} placeholder="32-char hex key for encrypting access tokens" />

      <div className="flex gap-3 pt-2">
        <Button onClick={handleSave} disabled={saving} className="flex-1">
          {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
          Save GitHub Config
        </Button>
      </div>

      <details className="text-xs text-muted-foreground border rounded-lg p-3">
        <summary className="cursor-pointer font-medium">Step-by-Step Setup</summary>
        <ol className="mt-2 space-y-1 list-decimal list-inside">
          <li>Go to <a href="https://github.com/settings/developers" target="_blank" rel="noopener noreferrer" className="text-purple-600 underline">GitHub Developer Settings <ExternalLink className="w-3 h-3 inline" /></a></li>
          <li>Click "New OAuth App"</li>
          <li>Set Authorization callback URL to: <code className="bg-muted px-1 rounded">{`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/github-oauth`}</code></li>
          <li>Copy the Client ID and generate a Client Secret</li>
          <li>Generate a 32-char hex encryption key: <code className="bg-muted px-1 rounded">openssl rand -hex 16</code></li>
          <li>Paste values above and save</li>
          <li>Deploy secrets to sync to the github-oauth edge function</li>
        </ol>
      </details>
    </ConfigSection>
  );
}

// ── Email (Resend) Config ──

function EmailConfig({ config, onSave }: { config: ConfigState; onSave: (entries: { key: string; value: unknown }[]) => Promise<void> }) {
  const [email, setEmail] = useState({ resendApiKey: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const stored = config.data.email_resend as { resendApiKey?: string } | undefined;
    setEmail({ resendApiKey: stored?.resendApiKey || '' });
  }, [config.data]);

  async function handleSave() {
    setSaving(true);
    try {
      await onSave([{ key: 'email_resend', value: email }]);
      toast.success('Email config saved');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  return (
    <ConfigSection title="Email (Resend)" icon={<Mail className="w-5 h-5 text-blue-500" />} description="Configure Resend API key for transactional emails (notifications, verification, receipts).">
      <SecretInput label="Resend API Key" value={email.resendApiKey} onChange={(v) => setEmail((p) => ({ ...p, resendApiKey: v }))} placeholder="re_xxxxxxxxxxxx" />

      <div className="flex gap-3 pt-2">
        <Button onClick={handleSave} disabled={saving} className="flex-1">
          {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
          Save Email Config
        </Button>
      </div>

      <details className="text-xs text-muted-foreground border rounded-lg p-3">
        <summary className="cursor-pointer font-medium">Setup Instructions</summary>
        <ol className="mt-2 space-y-1 list-decimal list-inside">
          <li>Sign up at <a href="https://resend.com" target="_blank" rel="noopener noreferrer" className="text-purple-600 underline">resend.com <ExternalLink className="w-3 h-3 inline" /></a></li>
          <li>Verify a domain (or use the sandbox domain for testing)</li>
          <li>Create an API key with "sending" permission</li>
          <li>Paste the key above and save</li>
          <li>Deploy secrets to sync to the send-email edge function</li>
        </ol>
      </details>
    </ConfigSection>
  );
}

// ── Payment Gateway Config ──

function PaymentConfig({ config, onSave }: { config: ConfigState; onSave: (entries: { key: string; value: unknown }[]) => Promise<void> }) {
  const [pmt, setPmt] = useState({ paystackSecretKey: '', flutterwaveSecretKey: '', flutterwaveEncryptionKey: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const stored = config.data.payment_gateways as { paystackSecretKey?: string; flutterwaveSecretKey?: string; flutterwaveEncryptionKey?: string } | undefined;
    setPmt({
      paystackSecretKey: stored?.paystackSecretKey || '',
      flutterwaveSecretKey: stored?.flutterwaveSecretKey || '',
      flutterwaveEncryptionKey: stored?.flutterwaveEncryptionKey || '',
    });
  }, [config.data]);

  async function handleSave() {
    setSaving(true);
    try {
      await onSave([{ key: 'payment_gateways', value: pmt }]);
      toast.success('Payment config saved');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  return (
    <ConfigSection title="Payment Gateways" icon={<CreditCard className="w-5 h-5 text-green-500" />} description="Configure payment processor keys for marketplace transactions and payouts.">
      <div className="p-3 rounded-lg border border-border space-y-3">
        <Label className="text-xs font-semibold">Paystack</Label>
        <SecretInput label="Secret Key" value={pmt.paystackSecretKey} onChange={(v) => setPmt((p) => ({ ...p, paystackSecretKey: v }))} placeholder="sk_live_xxxxxxxxxxxx" />
      </div>
      <div className="p-3 rounded-lg border border-border space-y-3">
        <Label className="text-xs font-semibold">Flutterwave</Label>
        <SecretInput label="Secret Key" value={pmt.flutterwaveSecretKey} onChange={(v) => setPmt((p) => ({ ...p, flutterwaveSecretKey: v }))} placeholder="FLWSECK-xxxxxxxxxxxx" />
        <SecretInput label="Encryption Key" value={pmt.flutterwaveEncryptionKey} onChange={(v) => setPmt((p) => ({ ...p, flutterwaveEncryptionKey: v }))} placeholder="FLWSECK_ENC-xxxxxxxxxxxx" />
      </div>

      <div className="flex gap-3 pt-2">
        <Button onClick={handleSave} disabled={saving} className="flex-1">
          {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
          Save Payment Config
        </Button>
      </div>

      <details className="text-xs text-muted-foreground border rounded-lg p-3">
        <summary className="cursor-pointer font-medium">Setup Instructions</summary>
        <ol className="mt-2 space-y-1 list-decimal list-inside">
          <li>Register at <a href="https://paystack.com" target="_blank" rel="noopener noreferrer" className="text-purple-600 underline">paystack.com <ExternalLink className="w-3 h-3 inline" /></a> or <a href="https://flutterwave.com" target="_blank" rel="noopener noreferrer" className="text-purple-600 underline">flutterwave.com <ExternalLink className="w-3 h-3 inline" /></a></li>
          <li>Go to Settings → API Keys &amp; Webhooks</li>
          <li>Copy the secret/live keys (NOT the public key)</li>
          <li>For Flutterwave, also copy the encryption key</li>
          <li>Paste values above and save</li>
          <li>Deploy secrets to sync to the marketplace-payments edge function</li>
        </ol>
      </details>
    </ConfigSection>
  );
}

// ── Offline / Local Payment Config ──

function OfflinePaymentConfig({ config, onSave }: { config: ConfigState; onSave: (entries: { key: string; value: unknown }[]) => Promise<void> }) {
  const [form, setForm] = useState({ enabled: false, bank_name: '', account_name: '', account_number: '', routing_number: '', swift_code: '', instructions: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const stored = config.data.offline_payment as typeof form | undefined;
    if (stored) setForm(stored);
  }, [config.data]);

  async function handleSave() {
    setSaving(true);
    try {
      await onSave([{ key: 'offline_payment', value: form }]);
      toast.success('Offline payment config saved');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  return (
    <ConfigSection title="Offline / Local Payment" icon={<Banknote className="w-5 h-5 text-amber-500" />} description="Configure bank transfer or local payment instructions for users who cannot pay via card.">
      <div className="flex items-center gap-3">
        <Switch checked={form.enabled} onCheckedChange={(v) => setForm((p) => ({ ...p, enabled: v }))} />
        <Label className="text-xs">Enable offline/local payments</Label>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Bank Name</Label>
          <Input value={form.bank_name} onChange={(e) => setForm((p) => ({ ...p, bank_name: e.target.value }))} placeholder="GTBank" className="text-sm" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Account Name</Label>
          <Input value={form.account_name} onChange={(e) => setForm((p) => ({ ...p, account_name: e.target.value }))} placeholder="SkillBridge Africa Ltd" className="text-sm" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Account Number</Label>
          <Input value={form.account_number} onChange={(e) => setForm((p) => ({ ...p, account_number: e.target.value }))} placeholder="0123456789" className="text-sm font-mono" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Routing / Sort Code</Label>
          <Input value={form.routing_number} onChange={(e) => setForm((p) => ({ ...p, routing_number: e.target.value }))} placeholder="011111111" className="text-sm font-mono" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">SWIFT / BIC Code</Label>
          <Input value={form.swift_code} onChange={(e) => setForm((p) => ({ ...p, swift_code: e.target.value }))} placeholder="GTBINGLA" className="text-sm font-mono" />
        </div>
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Payment Instructions</Label>
        <Textarea value={form.instructions} onChange={(e) => setForm((p) => ({ ...p, instructions: e.target.value }))} rows={3} className="text-sm" placeholder="Please make a bank transfer to the account below and upload your payment receipt." />
      </div>
      <Button onClick={handleSave} disabled={saving} size="sm">
        {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
        Save Offline Payment
      </Button>
    </ConfigSection>
  );
}

// ── Service Fee / Commission Config ──

function ServiceFeeConfig({ config, onSave }: { config: ConfigState; onSave: (entries: { key: string; value: unknown }[]) => Promise<void> }) {
  const [percentage, setPercentage] = useState(5);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const stored = config.data.service_fee as { percentage?: number } | undefined;
    if (stored?.percentage !== undefined) setPercentage(stored.percentage);
  }, [config.data]);

  async function handleSave() {
    setSaving(true);
    try {
      await onSave([{ key: 'service_fee', value: { percentage } }]);
      toast.success('Service fee config saved');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  return (
    <ConfigSection title="Service Fee / Commission" icon={<Percent className="w-5 h-5 text-blue-500" />} description="Set the platform commission percentage charged on each marketplace transaction.">
      <div className="space-y-1">
        <Label className="text-xs">Commission Percentage</Label>
        <div className="flex items-center gap-3">
          <Input
            type="number"
            min={0}
            max={100}
            step={0.5}
            value={percentage}
            onChange={(e) => setPercentage(Number(e.target.value))}
            className="w-32 text-lg font-bold"
          />
          <span className="text-2xl font-bold text-muted-foreground">%</span>
        </div>
        <p className="text-xs text-muted-foreground">Percentage charged on each transaction (e.g. 5 = 5% fee). Applied to all marketplace sales.</p>
      </div>
      <Button onClick={handleSave} disabled={saving} size="sm">
        {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
        Save Commission
      </Button>
    </ConfigSection>
  );
}

// ── Raw Key-Value Config Editor ──

function PlatformConfigEditor({ config, onRefresh }: { config: ConfigState; onRefresh: () => void }) {
  const [entries, setEntries] = useState<{ key: string; value: string }[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const list = Object.entries(config.data)
      .filter(([k]) => !k.startsWith('ai_provider_') && k !== 'ai_active_provider' && k !== 'github_oauth' && k !== 'email_resend' && k !== 'payment_gateways' && !k.startsWith('secret_'))
      .map(([key, value]) => ({ key, value: typeof value === 'string' ? value : JSON.stringify(value) }));
    setEntries(list.length > 0 ? list : [{ key: '', value: '' }]);
  }, [config.data]);

  function addRow() {
    setEntries((prev) => [...prev, { key: '', value: '' }]);
  }

  function removeRow(idx: number) {
    setEntries((prev) => prev.filter((_, i) => i !== idx));
  }

  function updateEntry(idx: number, field: 'key' | 'value', val: string) {
    setEntries((prev) => prev.map((e, i) => (i === idx ? { ...e, [field]: val } : e)));
  }

  async function handleSave() {
    const valid = entries.filter((e) => e.key.trim());
    if (valid.length === 0) {
      toast.error('Add at least one key-value pair');
      return;
    }
    setSaving(true);
    try {
      for (const e of valid) {
        let parsed: unknown = e.value;
        try { parsed = JSON.parse(e.value); } catch { /* keep as string */ }
        await setConfigValue(e.key.trim(), parsed);
      }
      toast.success('Config entries saved');
      onRefresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  return (
    <ConfigSection title="Platform Config" icon={<Settings className="w-5 h-5 text-gray-500" />} description="Generic key-value config editor for platform settings, feature flags, and custom values.">
      <div className="space-y-2">
        {entries.map((entry, idx) => (
          <div key={idx} className="flex gap-2 items-start">
            <div className="flex-1">
              <Input
                value={entry.key}
                onChange={(e) => updateEntry(idx, 'key', e.target.value)}
                placeholder="config_key"
                className="text-xs font-mono"
              />
            </div>
            <div className="flex-[2]">
              <Input
                value={entry.value}
                onChange={(e) => updateEntry(idx, 'value', e.target.value)}
                placeholder="value (JSON or string)"
                className="text-xs font-mono"
              />
            </div>
            <Button variant="ghost" size="sm" onClick={() => removeRow(idx)} disabled={entries.length === 1} className="text-destructive">✕</Button>
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        <Button variant="outline" size="sm" onClick={addRow}>+ Add Row</Button>
        <Button onClick={handleSave} disabled={saving || entries.every((e) => !e.key.trim())} size="sm">
          {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
          Save All
        </Button>
      </div>
    </ConfigSection>
  );
}

// ── Deploy Secrets Section ──

function DeploySecrets({ config }: { config: ConfigState }) {
  const [deploying, setDeploying] = useState(false);
  const [status, setStatus] = useState<{ ok: number; failed: number; results: { key: string; ok: boolean; error?: string }[] } | null>(null);

  async function handleDeploy() {
    setDeploying(true);
    setStatus(null);
    try {
      const secrets = await getSecretsToDeploy();
      const count = Object.keys(secrets).length;
      if (count === 0) {
        toast.error('No secrets configured. Save at least one service config first.');
        setDeploying(false);
        return;
      }

      const { deploySecrets } = await import('@/lib/admin-config');
      await deploySecrets(secrets);
      toast.success(`${count} secrets deployed to Supabase`);
      setStatus({ ok: count, failed: 0, results: Object.keys(secrets).map((k) => ({ key: k, ok: true })) });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Deploy failed');
      setStatus((prev) => prev || { ok: 0, failed: 1, results: [{ key: 'deploy', ok: false, error: err instanceof Error ? err.message : 'unknown' }] });
    } finally {
      setDeploying(false);
    }
  }

  return (
    <ConfigSection title="Deploy Secrets" icon={<Upload className="w-5 h-5 text-amber-500" />} description="Sync configured secrets from platform_config to Supabase edge function environment variables.">
      <p className="text-sm text-muted-foreground">
        This will deploy all configured API keys (AI providers, GitHub OAuth, Resend, payment gateways) as environment variables
        to Supabase edge functions, making them available at runtime via <code className="text-xs bg-muted px-1 rounded">Deno.env.get()</code>.
      </p>

      <div className="flex items-center gap-3 pt-2">
        <Button onClick={handleDeploy} disabled={deploying} className="bg-amber-600 hover:bg-amber-700">
          {deploying ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
          {deploying ? 'Deploying...' : 'Deploy Secrets to Supabase'}
        </Button>
        {config.loading && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
      </div>

      {status && (
        <div className="space-y-1 mt-2">
          <p className="text-sm">
            <span className="text-green-600">{status.ok} succeeded</span>
            {status.failed > 0 && <span className="text-red-600 ml-2">{status.failed} failed</span>}
          </p>
          {status.results.filter((r) => !r.ok).length > 0 && (
            <div className="bg-red-50 dark:bg-red-950/20 p-3 rounded-lg text-xs space-y-1">
              {status.results.filter((r) => !r.ok).map((r) => (
                <p key={r.key} className="text-red-700 dark:text-red-400"><strong>{r.key}:</strong> {r.error}</p>
              ))}
            </div>
          )}
        </div>
      )}

      <details className="text-xs text-muted-foreground border rounded-lg p-3 mt-2">
        <summary className="cursor-pointer font-medium">Required: Supabase Management API Key</summary>
        <p className="mt-2">
          For automatic secret deployment, set the <code className="bg-muted px-1 rounded">SUPABASE_MANAGEMENT_API_KEY</code> secret on the admin-api edge function.
          Get it from <a href="https://supabase.com/dashboard/account/tokens" target="_blank" rel="noopener noreferrer" className="text-purple-600 underline">Supabase Access Tokens <ExternalLink className="w-3 h-3 inline" /></a>.
          Without it, secrets are stored in platform_config (pending manual CLI deployment).
        </p>
        <p className="mt-1">
          CLI alternative: <code className="bg-muted px-1 rounded">supabase secrets set KEY=value</code>
        </p>
      </details>
    </ConfigSection>
  );
}

// ── Main Component ──

export default function AdminConfig() {
  const [config, setConfig] = useState<ConfigState>({ loading: true, saving: false, data: {} });

  useEffect(() => { loadConfig(); }, []);

  async function loadConfig() {
    setConfig((prev) => ({ ...prev, loading: true }));
    try {
      const { getConfig } = await import('@/lib/admin-config');
      const data = await getConfig();
      setConfig({ loading: false, saving: false, data });
    } catch (err) {
      toast.error('Failed to load config');
      setConfig({ loading: false, saving: false, data: {} });
    }
  }

  async function handleSave(entries: { key: string; value: unknown }[]) {
    const { setConfigValues } = await import('@/lib/admin-config');
    await setConfigValues(entries);
    await loadConfig();
  }

  if (config.loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-secondary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Configuration</h2>
          <p className="text-sm text-muted-foreground">Manage all platform services and secrets from one place</p>
        </div>
        <Button variant="outline" size="sm" onClick={loadConfig} disabled={config.loading}>
          <Loader2 className={`w-4 h-4 mr-1 ${config.loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AiConfig config={config} onSave={handleSave} />
        <PaymentConfig config={config} onSave={handleSave} />
        <OfflinePaymentConfig config={config} onSave={handleSave} />
        <ServiceFeeConfig config={config} onSave={handleSave} />
        <EmailConfig config={config} onSave={handleSave} />
        <GitHubConfig config={config} onSave={handleSave} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PlatformConfigEditor config={config} onRefresh={loadConfig} />
        <DeploySecrets config={config} />
      </div>
    </div>
  );
}

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Save, Plus, Trash2, Upload, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4001/api';

interface NavLink { name: string; href: string; }
interface FooterColumn { title: string; links: NavLink[]; }
interface AiProviderInfo { id: string; label: string; configured: boolean; active: boolean; }

interface SiteConfig {
  brand: { site_name: string; tagline: string; logo_url: string; favicon_url: string };
  hero: { badge: string; title: string; title_highlight: string; subtitle: string; hero_image_url: string; primary_cta_text: string; primary_cta_action: string; secondary_cta_text: string; secondary_cta_action: string };
  nav: { links: NavLink[] };
  footer: { description: string; columns: FooterColumn[]; newsletter_enabled: boolean; newsletter_placeholder: string; copyright_text: string };
  social: { twitter: string; linkedin: string; github: string; facebook: string; instagram: string };
  meta: { title: string; description: string; keywords: string; author: string; og_image_url: string; theme_color: string };
  api_keys: { preferred: string };
}

const DEFAULT_CONFIG: SiteConfig = {
  brand: { site_name: 'SkillBridge Africa', tagline: '', logo_url: '', favicon_url: '' },
  hero: { badge: '', title: '', title_highlight: '', subtitle: '', hero_image_url: '', primary_cta_text: '', primary_cta_action: '', secondary_cta_text: '', secondary_cta_action: '' },
  nav: { links: [{ name: 'Marketplace', href: '/marketplace' }] },
  footer: { description: '', columns: [], newsletter_enabled: true, newsletter_placeholder: '', copyright_text: '' },
  social: { twitter: '', linkedin: '', github: '', facebook: '', instagram: '' },
  meta: { title: '', description: '', keywords: '', author: '', og_image_url: '', theme_color: '#ffffff' },
  api_keys: { preferred: '' },
};

export default function SiteSettingsTab() {
  const [config, setConfig] = useState<SiteConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadTarget, setUploadTarget] = useState<string | null>(null);
  const [aiProviders, setAiProviders] = useState<AiProviderInfo[]>([]);
  const [testingAi, setTestingAi] = useState<string | null>(null);
  const [aiTestResult, setAiTestResult] = useState<{ provider: string; ok: boolean; message: string } | null>(null);
  const [apiKeyValues, setApiKeyValues] = useState<Record<string, string>>({});
  const [keySaving, setKeySaving] = useState(false);

  useEffect(() => { loadConfig(); loadProviders(); loadApiKeys(); }, []);

  const uploadFile = async (file: File, targetPath: string): Promise<string | null> => {
    const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const filePath = `${targetPath}/${fileName}`;
    const { error } = await supabase.storage.from('site-assets').upload(filePath, file, {
      cacheControl: '3600',
      upsert: true,
    });
    if (error) { toast.error('Upload failed: ' + error.message); return null; }
    const { data: urlData } = supabase.storage.from('site-assets').getPublicUrl(filePath);
    return urlData?.publicUrl || null;
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(field);
    const url = await uploadFile(file, field === 'logo_url' || field === 'favicon_url' ? 'brand' : 'hero');
    if (url) {
      if (field.startsWith('hero.')) {
        const key = field.split('.')[1];
        update('hero', { ...config.hero, [key]: url });
      } else if (field === 'og_image_url') {
        update('meta', { ...config.meta, og_image_url: url });
      } else {
        update('brand', { ...config.brand, [field]: url });
      }
      toast.success('Image uploaded');
    }
    setUploading(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const triggerUpload = (target: string) => {
    setUploadTarget(target);
    // Use a small timeout to let state update, then click
    setTimeout(() => fileInputRef.current?.click(), 0);
  };

  const loadApiKeys = async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) return;
      const res = await fetch(`${API_BASE}/ai/keys`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json = await res.json();
        if (json?.data) setApiKeyValues(json.data as Record<string, string>);
      }
    } catch { /* ignore */ }
  };

  const saveApiKeys = async () => {
    setKeySaving(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error('Not authenticated');
      const res = await fetch(`${API_BASE}/ai/keys`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ keys: apiKeyValues }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || 'Failed to save API keys');
      }
      toast.success('API keys saved');
      loadProviders(); // refresh configured status
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save API keys');
    } finally {
      setKeySaving(false);
    }
  };

  const loadProviders = async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) return;
      const res = await fetch(`${API_BASE}/ai/providers`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json = await res.json();
        if (json?.data) setAiProviders(json.data as AiProviderInfo[]);
      }
    } catch { /* ignore */ }
  };

  const testAiProvider = async (providerId: string) => {
    setTestingAi(providerId);
    setAiTestResult(null);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      const res = await fetch(`${API_BASE}/ai/test`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: providerId || undefined }),
      });
      if (res.ok) {
        setAiTestResult({ provider: providerId, ok: true, message: 'API key is working' });
      } else {
        const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        setAiTestResult({ provider: providerId, ok: false, message: err.error || 'Test failed' });
      }
    } catch (err) {
      setAiTestResult({ provider: providerId, ok: false, message: err instanceof Error ? err.message : 'Request failed' });
    } finally {
      setTestingAi(null);
    }
  };

  const loadConfig = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/site-config`);
      if (res.ok) {
        const json = await res.json();
        if (json?.data) {
          const raw = json.data as Record<string, unknown>;
          // api_keys may be old format (flat booleans) — normalise to { preferred: '' }
          const apiKeys = (raw.api_keys as Record<string, unknown>) || {};
          const normalised = typeof apiKeys.preferred === 'string' ? apiKeys : { preferred: '' };
          setConfig({ ...DEFAULT_CONFIG, ...raw, api_keys: normalised } as SiteConfig);
        }
      }
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  const saveConfig = async () => {
    setSaving(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error('Not authenticated');

      const res = await fetch(`${API_BASE}/admin/settings`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'site_config', value: config }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || 'Failed to save');
      }
      toast.success('Site settings saved');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save');
    } finally { setSaving(false); }
  };

  const update = <K extends keyof SiteConfig>(section: K, value: SiteConfig[K]) => {
    setConfig((prev) => ({ ...prev, [section]: value }));
  };

  const addNavLink = () => {
    update('nav', { links: [...config.nav.links, { name: '', href: '' }] });
  };

  const removeNavLink = (i: number) => {
    const links = config.nav.links.filter((_, idx) => idx !== i);
    update('nav', { links });
  };

  const updateNavLink = (i: number, field: keyof NavLink, value: string) => {
    const links = config.nav.links.map((l, idx) => (idx === i ? { ...l, [field]: value } : l));
    update('nav', { links });
  };

  const addFooterCol = () => {
    update('footer', { ...config.footer, columns: [...config.footer.columns, { title: '', links: [] }] });
  };

  const removeFooterCol = (i: number) => {
    const cols = config.footer.columns.filter((_, idx) => idx !== i);
    update('footer', { ...config.footer, columns: cols });
  };

  const addFooterLink = (colIdx: number) => {
    const cols = config.footer.columns.map((c, idx) =>
      idx === colIdx ? { ...c, links: [...c.links, { name: '', href: '' }] } : c
    );
    update('footer', { ...config.footer, columns: cols });
  };

  const updateFooterCol = (colIdx: number, title: string) => {
    const cols = config.footer.columns.map((c, idx) => (idx === colIdx ? { ...c, title } : c));
    update('footer', { ...config.footer, columns: cols });
  };

  const updateFooterLink = (colIdx: number, linkIdx: number, field: keyof NavLink, value: string) => {
    const cols = config.footer.columns.map((c, idx) =>
      idx === colIdx
        ? { ...c, links: c.links.map((l, li) => (li === linkIdx ? { ...l, [field]: value } : l)) }
        : c
    );
    update('footer', { ...config.footer, columns: cols });
  };

  const removeFooterLink = (colIdx: number, linkIdx: number) => {
    const cols = config.footer.columns.map((c, idx) =>
      idx === colIdx ? { ...c, links: c.links.filter((_, li) => li !== linkIdx) } : c
    );
    update('footer', { ...config.footer, columns: cols });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-secondary" />
      </div>
    );
  }

  return (
    <Card>
      {/* Hidden file input for image uploads */}
      <input
        type="file"
        accept="image/*"
        className="hidden"
        ref={fileInputRef}
        onChange={(e) => {
          if (uploadTarget) handleFileSelect(e, uploadTarget);
        }}
      />

      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Site Settings</CardTitle>
          <Button onClick={saveConfig} disabled={saving} className="gap-1.5">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving...' : 'Save All'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-10 max-w-2xl">
        {/* ── Branding ── */}
        <section className="space-y-4">
          <h3 className="text-lg font-semibold border-b pb-2">Branding</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5"><Label>Site Name</Label><Input value={config.brand.site_name} onChange={(e) => update('brand', { ...config.brand, site_name: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Tagline</Label><Input value={config.brand.tagline} onChange={(e) => update('brand', { ...config.brand, tagline: e.target.value })} /></div>
            <div className="space-y-1.5">
              <Label>Logo</Label>
              <div className="flex gap-2">
                <Input value={config.brand.logo_url} onChange={(e) => update('brand', { ...config.brand, logo_url: e.target.value })} placeholder="https://... or upload" className="flex-1" />
                <Button size="sm" variant="outline" onClick={() => triggerUpload('logo_url')} disabled={uploading === 'logo_url'}>
                  {uploading === 'logo_url' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                </Button>
              </div>
              {config.brand.logo_url && <img src={config.brand.logo_url} alt="Logo preview" className="h-10 mt-1 rounded border" />}
            </div>
            <div className="space-y-1.5">
              <Label>Favicon</Label>
              <div className="flex gap-2">
                <Input value={config.brand.favicon_url} onChange={(e) => update('brand', { ...config.brand, favicon_url: e.target.value })} placeholder="https://... or upload" className="flex-1" />
                <Button size="sm" variant="outline" onClick={() => triggerUpload('favicon_url')} disabled={uploading === 'favicon_url'}>
                  {uploading === 'favicon_url' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                </Button>
              </div>
              {config.brand.favicon_url && <img src={config.brand.favicon_url} alt="Favicon preview" className="h-6 mt-1 rounded border" />}
            </div>
          </div>
        </section>

        {/* ── Hero ── */}
        <section className="space-y-4">
          <h3 className="text-lg font-semibold border-b pb-2">Hero Section</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5"><Label>Badge</Label><Input value={config.hero.badge} onChange={(e) => update('hero', { ...config.hero, badge: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Title Highlight</Label><Input value={config.hero.title_highlight} onChange={(e) => update('hero', { ...config.hero, title_highlight: e.target.value })} /></div>
            <div className="col-span-2 space-y-1.5"><Label>Title</Label><Input value={config.hero.title} onChange={(e) => update('hero', { ...config.hero, title: e.target.value })} /></div>
            <div className="col-span-2 space-y-1.5"><Label>Subtitle</Label><Textarea value={config.hero.subtitle} onChange={(e) => update('hero', { ...config.hero, subtitle: e.target.value })} rows={3} /></div>
            <div className="col-span-2 space-y-1.5">
              <Label>Hero Image</Label>
              <div className="flex gap-2">
                <Input value={config.hero.hero_image_url} onChange={(e) => update('hero', { ...config.hero, hero_image_url: e.target.value })} placeholder="https://... or upload" className="flex-1" />
                <Button size="sm" variant="outline" onClick={() => triggerUpload('hero.hero_image_url')} disabled={uploading === 'hero.hero_image_url'}>
                  {uploading === 'hero.hero_image_url' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                </Button>
              </div>
              {config.hero.hero_image_url && <img src={config.hero.hero_image_url} alt="Hero preview" className="h-20 mt-1 rounded border object-cover" />}
            </div>
            <div className="space-y-1.5"><Label>Primary CTA Text</Label><Input value={config.hero.primary_cta_text} onChange={(e) => update('hero', { ...config.hero, primary_cta_text: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Primary CTA Action</Label><Input value={config.hero.primary_cta_action} onChange={(e) => update('hero', { ...config.hero, primary_cta_action: e.target.value })} placeholder="#programs" /></div>
            <div className="space-y-1.5"><Label>Secondary CTA Text</Label><Input value={config.hero.secondary_cta_text} onChange={(e) => update('hero', { ...config.hero, secondary_cta_text: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Secondary CTA Action</Label><Input value={config.hero.secondary_cta_action} onChange={(e) => update('hero', { ...config.hero, secondary_cta_action: e.target.value })} placeholder="#mission" /></div>
          </div>
        </section>

        {/* ── Navigation ── */}
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b pb-2">
            <h3 className="text-lg font-semibold">Navigation Links</h3>
            <Button size="sm" variant="outline" onClick={addNavLink}><Plus className="w-3.5 h-3.5 mr-1" /> Add Link</Button>
          </div>
          {config.nav.links.map((link, i) => (
            <div key={i} className="flex items-end gap-2">
              <div className="flex-1 space-y-1"><Label className="text-xs">Name</Label><Input value={link.name} onChange={(e) => updateNavLink(i, 'name', e.target.value)} placeholder="Link name" /></div>
              <div className="flex-1 space-y-1"><Label className="text-xs">Href</Label><Input value={link.href} onChange={(e) => updateNavLink(i, 'href', e.target.value)} placeholder="/path" /></div>
              <Button size="icon" variant="ghost" className="text-red-500 mb-0.5" onClick={() => removeNavLink(i)}><Trash2 className="w-4 h-4" /></Button>
            </div>
          ))}
        </section>

        {/* ── Footer ── */}
        <section className="space-y-4">
          <h3 className="text-lg font-semibold border-b pb-2">Footer</h3>
          <div className="space-y-1.5"><Label>Description</Label><Textarea value={config.footer.description} onChange={(e) => update('footer', { ...config.footer, description: e.target.value })} rows={2} /></div>
          <div className="space-y-1.5"><Label>Copyright Text</Label><Input value={config.footer.copyright_text} onChange={(e) => update('footer', { ...config.footer, copyright_text: e.target.value })} placeholder="{year} will be replaced" /></div>
          <div className="flex items-center gap-2">
            <input type="checkbox" checked={config.footer.newsletter_enabled} onChange={(e) => update('footer', { ...config.footer, newsletter_enabled: e.target.checked })} className="rounded" />
            <Label className="text-sm">Enable Newsletter Signup</Label>
          </div>
          <div className="space-y-1.5"><Label>Newsletter Placeholder</Label><Input value={config.footer.newsletter_placeholder} onChange={(e) => update('footer', { ...config.footer, newsletter_placeholder: e.target.value })} /></div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="font-medium">Footer Columns</Label>
              <Button size="sm" variant="outline" onClick={addFooterCol}><Plus className="w-3.5 h-3.5 mr-1" /> Add Column</Button>
            </div>
            {config.footer.columns.map((col, ci) => (
              <div key={ci} className="border rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <Input value={col.title} onChange={(e) => updateFooterCol(ci, e.target.value)} placeholder="Column title" className="max-w-xs" />
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => addFooterLink(ci)}><Plus className="w-3.5 h-3.5" /></Button>
                    <Button size="sm" variant="ghost" className="text-red-500" onClick={() => removeFooterCol(ci)}><Trash2 className="w-3.5 h-3.5" /></Button>
                  </div>
                </div>
                {col.links.map((link, li) => (
                  <div key={li} className="flex items-center gap-2 ml-4">
                    <Input value={link.name} onChange={(e) => updateFooterLink(ci, li, 'name', e.target.value)} placeholder="Link name" className="flex-1" />
                    <Input value={link.href} onChange={(e) => updateFooterLink(ci, li, 'href', e.target.value)} placeholder="URL" className="flex-1" />
                    <Button size="icon" variant="ghost" className="text-red-500 h-8 w-8" onClick={() => removeFooterLink(ci, li)}><Trash2 className="w-3.5 h-3.5" /></Button>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </section>

        {/* ── Social Links ── */}
        <section className="space-y-4">
          <h3 className="text-lg font-semibold border-b pb-2">Social Links</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5"><Label>Twitter URL</Label><Input value={config.social.twitter} onChange={(e) => update('social', { ...config.social, twitter: e.target.value })} placeholder="https://twitter.com/..." /></div>
            <div className="space-y-1.5"><Label>LinkedIn URL</Label><Input value={config.social.linkedin} onChange={(e) => update('social', { ...config.social, linkedin: e.target.value })} placeholder="https://linkedin.com/..." /></div>
            <div className="space-y-1.5"><Label>GitHub URL</Label><Input value={config.social.github} onChange={(e) => update('social', { ...config.social, github: e.target.value })} placeholder="https://github.com/..." /></div>
            <div className="space-y-1.5"><Label>Facebook URL</Label><Input value={config.social.facebook} onChange={(e) => update('social', { ...config.social, facebook: e.target.value })} placeholder="https://facebook.com/..." /></div>
            <div className="space-y-1.5"><Label>Instagram URL</Label><Input value={config.social.instagram} onChange={(e) => update('social', { ...config.social, instagram: e.target.value })} placeholder="https://instagram.com/..." /></div>
          </div>
        </section>

        {/* ── Meta Tags ── */}
        <section className="space-y-4">
          <h3 className="text-lg font-semibold border-b pb-2">Meta Tags</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5"><Label>Title</Label><Input value={config.meta.title} onChange={(e) => update('meta', { ...config.meta, title: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Author</Label><Input value={config.meta.author} onChange={(e) => update('meta', { ...config.meta, author: e.target.value })} /></div>
            <div className="col-span-2 space-y-1.5"><Label>Description</Label><Textarea value={config.meta.description} onChange={(e) => update('meta', { ...config.meta, description: e.target.value })} rows={2} /></div>
            <div className="col-span-2 space-y-1.5"><Label>Keywords</Label><Input value={config.meta.keywords} onChange={(e) => update('meta', { ...config.meta, keywords: e.target.value })} placeholder="keyword1, keyword2" /></div>
            <div className="space-y-1.5"><Label>OG Image URL</Label><Input value={config.meta.og_image_url} onChange={(e) => update('meta', { ...config.meta, og_image_url: e.target.value })} placeholder="https://..." /></div>
            <div className="space-y-1.5"><Label>Theme Color</Label><Input value={config.meta.theme_color} onChange={(e) => update('meta', { ...config.meta, theme_color: e.target.value })} placeholder="#ffffff" /></div>
          </div>
        </section>

        {/* ── AI Settings ── */}
        <section className="space-y-4">
          <h3 className="text-lg font-semibold border-b pb-2">AI Settings</h3>

          {/* API Key Inputs */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Provider API Keys</Label>
            {aiProviders.length === 0 && <p className="text-sm text-muted-foreground">Loading providers...</p>}
            {aiProviders.map((p) => (
              <div key={p.id} className="flex items-center gap-2">
                <Label className="w-28 shrink-0 text-sm">{p.label}</Label>
                <Input
                  type="password"
                  placeholder={apiKeyValues[p.id] ? '•••••••• (key stored)' : `Enter ${p.label} API key`}
                  value={apiKeyValues[p.id] || ''}
                  onChange={(e) => setApiKeyValues((prev) => ({ ...prev, [p.id]: e.target.value }))}
                  className="flex-1"
                />
              </div>
            ))}
            <Button
              size="sm"
              onClick={saveApiKeys}
              disabled={keySaving}
              className="gap-1.5"
            >
              {keySaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              {keySaving ? 'Saving Keys...' : 'Save API Keys'}
            </Button>
          </div>

          {/* Preferred Provider & Test */}
          <div className="space-y-3 pt-2">
            <div className="space-y-1.5">
              <Label>Preferred AI Provider</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={config.api_keys.preferred}
                onChange={(e) => update('api_keys', { ...config.api_keys, preferred: e.target.value })}
              >
                <option value="">— Select provider —</option>
                {aiProviders.map((p) => (
                  <option key={p.id} value={p.id} disabled={!p.configured}>
                    {p.label} {p.configured ? '' : '(not configured)'} {p.active ? '(active)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end gap-3">
              <Button
                size="sm"
                variant="outline"
                onClick={() => testAiProvider(config.api_keys.preferred)}
                disabled={!config.api_keys.preferred || testingAi !== null}
                className="gap-1.5"
              >
                {testingAi ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                {testingAi ? 'Testing...' : 'Test API Key'}
              </Button>
              {aiTestResult && (
                <span className={`flex items-center gap-1 text-sm ${aiTestResult.ok ? 'text-green-600' : 'text-red-600'}`}>
                  {aiTestResult.ok ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                  {aiTestResult.message}
                </span>
              )}
            </div>
          </div>
        </section>

        <div className="pt-4 border-t">
          <Button onClick={saveConfig} disabled={saving} className="gap-1.5">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving...' : 'Save All'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

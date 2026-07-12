import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useSiteSettings, type SiteConfig } from '@/hooks/useSiteSettings';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Save, Plus, Trash2, Palette, Upload } from 'lucide-react';

function SectionCard({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <Card className="border-l-4 border-l-purple-500">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">{icon} {title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  );
}

function BrandUploadField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const ext = file.name.split('.').pop() || 'png';
      const path = `brand/${label.toLowerCase().replace(/\s+/g, '-')}_${Date.now()}.${ext}`;
      const { data, error } = await supabase.storage.from('public').upload(path, file, {
        cacheControl: '3600',
        upsert: true,
      });
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('public').getPublicUrl(data.path);
      onChange(publicUrl);
      toast.success(`${label} uploaded`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      <div className="flex gap-2">
        <div className="flex-1">
          <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={`${label} URL`} className="text-sm" />
        </div>
        <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading} className="shrink-0">
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
        </Button>
        <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp" className="hidden" onChange={handleFile} />
      </div>
      {value && (
        <div className="mt-1 border rounded-lg overflow-hidden w-16 h-16 bg-muted/30 flex items-center justify-center">
          <img src={value} alt={label} className="max-w-full max-h-full object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
        </div>
      )}
    </div>
  );
}

export default function SiteSettingsEditor() {
  const { config, loading: configLoading } = useSiteSettings();
  const [form, setForm] = useState<SiteConfig | null>(null);
  const [saving, setSaving] = useState(false);
  const [savingField, setSavingField] = useState<string | null>(null);

  useEffect(() => {
    if (config && !form) {
      setForm(structuredClone(config));
    }
  }, [config, form]);

  function updateField(section: keyof SiteConfig, field: string, value: unknown) {
    if (!form) return;
    setForm((prev) => {
      if (!prev) return prev;
      const updated = { ...prev };
      (updated[section] as Record<string, unknown>)[field] = value;
      return updated;
    });
  }

  function updateNestedField(section: keyof SiteConfig, index: number, subField: string, value: unknown) {
    if (!form) return;
    setForm((prev) => {
      if (!prev) return prev;
      const updated = { ...prev };
      const arr = [...(updated[section] as unknown[])] as Record<string, unknown>[];
      arr[index] = { ...arr[index], [subField]: value };
      (updated[section] as unknown) = arr;
      return updated;
    });
  }

  async function saveAll() {
    if (!form) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('platform_config')
        .upsert({ key: 'site_config', value: form }, { onConflict: 'key' });
      if (error) throw error;
      toast.success('All site settings saved');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  async function saveBubbleColors() {
    setSavingField('bubble');
    try {
      const val = form?.api_keys?.chat_bubble_style;
      const { error } = await supabase
        .from('platform_config')
        .upsert({ key: 'chat_bubble_style', value: val || {} }, { onConflict: 'key' });
      if (error) throw error;
      toast.success('Bubble colors saved');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSavingField(null);
    }
  }

  if (configLoading || !form) {
    return <div className="flex justify-center py-24"><Loader2 className="w-8 h-8 animate-spin text-secondary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Site Settings</h2>
        <Button onClick={saveAll} disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
          Save All Settings
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Brand */}
        <SectionCard title="Brand" icon={<Badge variant="outline" className="text-purple-600">B</Badge>}>
          <Field label="Site Name" value={form.brand.site_name} onChange={(v) => updateField('brand', 'site_name', v)} />
          <Field label="Tagline" value={form.brand.tagline} onChange={(v) => updateField('brand', 'tagline', v)} />
          <BrandUploadField label="Logo" value={form.brand.logo_url} onChange={(v) => updateField('brand', 'logo_url', v)} />
          <BrandUploadField label="Favicon" value={form.brand.favicon_url} onChange={(v) => updateField('brand', 'favicon_url', v)} />
        </SectionCard>

        {/* Hero */}
        <SectionCard title="Hero Section" icon={<Badge variant="outline" className="text-purple-600">H</Badge>}>
          <Field label="Badge" value={form.hero.badge} onChange={(v) => updateField('hero', 'badge', v)} />
          <Field label="Title" value={form.hero.title} onChange={(v) => updateField('hero', 'title', v)} />
          <Field label="Title Highlight" value={form.hero.title_highlight} onChange={(v) => updateField('hero', 'title_highlight', v)} />
          <TextareaField label="Subtitle" value={form.hero.subtitle} onChange={(v) => updateField('hero', 'subtitle', v)} />
          <Field label="Hero Image URL" value={form.hero.hero_image_url} onChange={(v) => updateField('hero', 'hero_image_url', v)} />
          <Field label="Primary CTA Text" value={form.hero.primary_cta_text} onChange={(v) => updateField('hero', 'primary_cta_text', v)} />
          <Field label="Primary CTA Action" value={form.hero.primary_cta_action} onChange={(v) => updateField('hero', 'primary_cta_action', v)} />
          <Field label="Secondary CTA Text" value={form.hero.secondary_cta_text} onChange={(v) => updateField('hero', 'secondary_cta_text', v)} />
          <Field label="Secondary CTA Action" value={form.hero.secondary_cta_action} onChange={(v) => updateField('hero', 'secondary_cta_action', v)} />
        </SectionCard>

        {/* Navigation */}
        <SectionCard title="Navigation Links" icon={<Badge variant="outline" className="text-purple-600">N</Badge>}>
          <p className="text-xs text-muted-foreground">Links displayed in the top navbar.</p>
          {form.nav.links.map((link, i) => (
            <div key={i} className="flex gap-2 items-start">
              <div className="flex-1">
                <Input value={link.name} onChange={(e) => updateNestedField('nav', i, 'name', e.target.value)} placeholder="Link name" className="text-xs" />
              </div>
              <div className="flex-1">
                <Input value={link.href} onChange={(e) => updateNestedField('nav', i, 'href', e.target.value)} placeholder="/path" className="text-xs font-mono" />
              </div>
              <Button variant="ghost" size="sm" onClick={() => {
                const links = form.nav.links.filter((_, j) => j !== i);
                setForm((prev) => prev ? { ...prev, nav: { ...prev.nav, links } } : prev);
              }} className="text-destructive"><Trash2 className="w-4 h-4" /></Button>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={() => {
            setForm((prev) => prev ? { ...prev, nav: { ...prev.nav, links: [...prev.nav.links, { name: '', href: '' }] } } : prev);
          }}><Plus className="w-4 h-4 mr-1" /> Add Link</Button>
        </SectionCard>

        {/* Social */}
        <SectionCard title="Social Links" icon={<Badge variant="outline" className="text-purple-600">S</Badge>}>
          <Field label="Twitter URL" value={form.social.twitter} onChange={(v) => updateField('social', 'twitter', v)} />
          <Field label="LinkedIn URL" value={form.social.linkedin} onChange={(v) => updateField('social', 'linkedin', v)} />
          <Field label="GitHub URL" value={form.social.github} onChange={(v) => updateField('social', 'github', v)} />
          <Field label="Facebook URL" value={form.social.facebook} onChange={(v) => updateField('social', 'facebook', v)} />
          <Field label="Instagram URL" value={form.social.instagram} onChange={(v) => updateField('social', 'instagram', v)} />
        </SectionCard>

        {/* Footer */}
        <SectionCard title="Footer" icon={<Badge variant="outline" className="text-purple-600">F</Badge>}>
          <TextareaField label="Description" value={form.footer.description} onChange={(v) => updateField('footer', 'description', v)} />
          <Field label="Copyright Text" value={form.footer.copyright_text} onChange={(v) => updateField('footer', 'copyright_text', v)} placeholder="© {year} SkillBridge Africa." />
          <Field label="Newsletter Placeholder" value={form.footer.newsletter_placeholder} onChange={(v) => updateField('footer', 'newsletter_placeholder', v)} />
          <div className="flex items-center gap-2">
            <input type="checkbox" id="newsletter" checked={form.footer.newsletter_enabled} onChange={(e) => updateField('footer', 'newsletter_enabled', e.target.checked)} className="rounded" />
            <Label htmlFor="newsletter">Enable Newsletter Signup</Label>
          </div>

          <div className="pt-2 border-t">
            <p className="text-xs font-medium text-muted-foreground mb-2">Footer Columns (Programs, Community, etc.)</p>
            {form.footer.columns.map((col, ci) => (
              <div key={ci} className="mb-3 p-3 bg-muted/20 rounded-lg space-y-2">
                <div className="flex items-center gap-2">
                  <Input value={col.title} onChange={(e) => {
                    const cols = [...form.footer.columns];
                    cols[ci] = { ...cols[ci], title: e.target.value };
                    setForm((prev) => prev ? { ...prev, footer: { ...prev.footer, columns: cols } } : prev);
                  }} placeholder="Column title" className="text-xs font-medium" />
                  <Button variant="ghost" size="sm" onClick={() => {
                    setForm((prev) => {
                      if (!prev) return prev;
                      return { ...prev, footer: { ...prev.footer, columns: prev.footer.columns.filter((_, j) => j !== ci) } };
                    });
                  }} className="text-destructive"><Trash2 className="w-4 h-4" /></Button>
                </div>
                {col.links.map((link, li) => (
                  <div key={li} className="flex gap-2 pl-4">
                    <Input value={link.name} onChange={(e) => {
                      const cols = [...form.footer.columns];
                      cols[ci] = { ...cols[ci], links: cols[ci].links.map((l, j) => j === li ? { ...l, name: e.target.value } : l) };
                      setForm((prev) => prev ? { ...prev, footer: { ...prev.footer, columns: cols } } : prev);
                    }} placeholder="Link name" className="text-xs" />
                    <Input value={link.href} onChange={(e) => {
                      const cols = [...form.footer.columns];
                      cols[ci] = { ...cols[ci], links: cols[ci].links.map((l, j) => j === li ? { ...l, href: e.target.value } : l) };
                      setForm((prev) => prev ? { ...prev, footer: { ...prev.footer, columns: cols } } : prev);
                    }} placeholder="/path" className="text-xs font-mono" />
                    <Button variant="ghost" size="sm" onClick={() => {
                      const cols = [...form.footer.columns];
                      cols[ci] = { ...cols[ci], links: cols[ci].links.filter((_, j) => j !== li) };
                      setForm((prev) => prev ? { ...prev, footer: { ...prev.footer, columns: cols } } : prev);
                    }} className="text-destructive"><Trash2 className="w-4 h-4" /></Button>
                  </div>
                ))}
                <Button variant="ghost" size="sm" onClick={() => {
                  const cols = [...form.footer.columns];
                  cols[ci] = { ...cols[ci], links: [...cols[ci].links, { name: '', href: '' }] };
                  setForm((prev) => prev ? { ...prev, footer: { ...prev.footer, columns: cols } } : prev);
                }}><Plus className="w-4 h-4 mr-1" /> Add Link</Button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={() => {
              setForm((prev) => {
                if (!prev) return prev;
                return { ...prev, footer: { ...prev.footer, columns: [...prev.footer.columns, { title: '', links: [{ name: '', href: '' }] }] } };
              });
            }}><Plus className="w-4 h-4 mr-1" /> Add Column</Button>
          </div>
        </SectionCard>

        {/* SEO / Meta */}
        <SectionCard title="SEO & Meta" icon={<Badge variant="outline" className="text-purple-600">M</Badge>}>
          <Field label="Page Title" value={form.meta.title} onChange={(v) => updateField('meta', 'title', v)} />
          <TextareaField label="Meta Description" value={form.meta.description} onChange={(v) => updateField('meta', 'description', v)} />
          <TextareaField label="Meta Keywords" value={form.meta.keywords} onChange={(v) => updateField('meta', 'keywords', v)} />
          <Field label="Author" value={form.meta.author} onChange={(v) => updateField('meta', 'author', v)} />
          <Field label="OG Image URL" value={form.meta.og_image_url} onChange={(v) => updateField('meta', 'og_image_url', v)} />
          <Field label="Theme Color" value={form.meta.theme_color} onChange={(v) => updateField('meta', 'theme_color', v)} />
        </SectionCard>

        {/* Chat Bubble Colors */}
        <SectionCard title="Chat Bubble Colors" icon={<Palette className="w-5 h-5 text-purple-500" />}>
          <ChatBubbleColorEditor
            colors={(form.api_keys?.chat_bubble_style as { my_bubble_bg?: string; my_bubble_text?: string; other_bubble_bg?: string; other_bubble_text?: string }) || {}}
            onChange={(colors) => {
              const apiKeys = { ...form.api_keys, chat_bubble_style: colors };
              setForm((prev) => prev ? { ...prev, api_keys: apiKeys as Record<string, { api_key: string; enabled: boolean }> } : prev);
            }}
          />
          <Button onClick={saveBubbleColors} disabled={savingField === 'bubble'} size="sm" variant="outline" className="w-full">
            {savingField === 'bubble' ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Save Bubble Colors
          </Button>
        </SectionCard>
      </div>

      <div className="flex justify-end">
        <Button onClick={saveAll} disabled={saving} size="lg">
          {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
          Save All Settings
        </Button>
      </div>
    </div>
  );
}

// ── Sub-components ──

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="text-sm" />
    </div>
  );
}

function TextareaField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      <Textarea value={value} onChange={(e) => onChange(e.target.value)} rows={2} className="text-sm" />
    </div>
  );
}

function ChatBubbleColorEditor({ colors, onChange }: {
  colors: Record<string, string>;
  onChange: (c: Record<string, string>) => void;
}) {
  const fields = [
    { key: 'my_bubble_bg', label: 'My Bubble BG', default: '#7c3aed' },
    { key: 'my_bubble_text', label: 'My Bubble Text', default: '#ffffff' },
    { key: 'other_bubble_bg', label: 'Other Bubble BG', default: '#f3f4f6' },
    { key: 'other_bubble_text', label: 'Other Bubble Text', default: '#111827' },
  ];

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 mb-3 p-3 bg-muted/30 rounded-lg">
        <p className="text-xs font-medium text-muted-foreground">Preview</p>
        <div className="flex flex-col gap-2">
          <div className="flex justify-end">
            <div className="max-w-[70%] px-3 py-2 rounded-2xl rounded-br-md text-sm"
              style={{ backgroundColor: colors.my_bubble_bg || '#7c3aed', color: colors.my_bubble_text || '#ffffff' }}>
              My message
            </div>
          </div>
          <div className="flex justify-start">
            <div className="max-w-[70%] px-3 py-2 rounded-2xl rounded-bl-md text-sm"
              style={{ backgroundColor: colors.other_bubble_bg || '#f3f4f6', color: colors.other_bubble_text || '#111827' }}>
              Their message
            </div>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {fields.map((f) => (
          <div key={f.key} className="space-y-1">
            <Label className="text-xs">{f.label}</Label>
            <div className="flex gap-2 items-center">
              <input type="color" value={colors[f.key] || f.default}
                onChange={(e) => onChange({ ...colors, [f.key]: e.target.value })}
                className="w-8 h-8 rounded cursor-pointer border shrink-0" />
              <Input value={colors[f.key] || f.default}
                onChange={(e) => onChange({ ...colors, [f.key]: e.target.value })}
                className="font-mono text-xs" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

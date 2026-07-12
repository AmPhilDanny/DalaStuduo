import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Loader2, Plus, Pencil, Trash2, Save, X, Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { getPlans, createPlan, updatePlan, deletePlan, type SubscriptionPlan } from '@/lib/admin-plans';

export default function SubscriptionPlansEditor() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '', slug: '', description: '', price_monthly: 0, price_yearly: 0,
    max_members: 1, max_active_jobs: 1, is_active: true, sort_order: 0,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadPlans(); }, []);

  async function loadPlans() {
    setLoading(true);
    try {
      const data = await getPlans();
      setPlans(data);
    } catch { toast.error('Failed to load plans'); }
    finally { setLoading(false); }
  }

  function openNew() {
    setEditingId(null);
    setForm({ name: '', slug: '', description: '', price_monthly: 0, price_yearly: 0, max_members: 1, max_active_jobs: 1, is_active: true, sort_order: plans.length });
  }

  function openEdit(plan: SubscriptionPlan) {
    setEditingId(plan.id);
    setForm({
      name: plan.name, slug: plan.slug, description: plan.description || '',
      price_monthly: Number(plan.price_monthly), price_yearly: Number(plan.price_yearly),
      max_members: plan.max_members, max_active_jobs: plan.max_active_jobs,
      is_active: plan.is_active, sort_order: plan.sort_order,
    });
  }

  function slugify(name: string) {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'untitled';
  }

  async function handleSave() {
    if (!form.name || !form.slug) { toast.error('Name and slug are required'); return; }
    setSaving(true);
    try {
      if (editingId) {
        await updatePlan(editingId, form);
        toast.success('Plan updated');
      } else {
        await createPlan(form as any);
        toast.success('Plan created');
      }
      setEditingId(null);
      await loadPlans();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save');
    } finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this plan? Users on this plan will be affected.')) return;
    try {
      await deletePlan(id);
      toast.success('Plan deleted');
      await loadPlans();
      if (editingId === id) setEditingId(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete');
    }
  }

  if (loading) {
    return <div className="flex justify-center py-24"><Loader2 className="w-8 h-8 animate-spin text-secondary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Subscription Plans</h2>
          <p className="text-sm text-muted-foreground">Manage B2B subscription tiers, pricing, and limits</p>
        </div>
        <Button onClick={openNew} disabled={!!editingId}>
          <Plus className="w-4 h-4 mr-1" /> New Plan
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Plan List */}
        <Card>
          <CardHeader><CardTitle className="text-base">All Plans</CardTitle></CardHeader>
          <CardContent>
            {plans.length === 0 ? (
              <p className="text-center text-muted-foreground py-8 text-sm">No plans yet.</p>
            ) : (
              <div className="space-y-2">
                {plans.map((plan) => (
                  <div key={plan.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/30 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-purple-500" />
                        <span className="font-medium text-sm">{plan.name}</span>
                        <Badge variant={plan.is_active ? 'default' : 'secondary'} className="text-[10px]">
                          {plan.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        ${plan.price_monthly}/mo · ${plan.price_yearly}/yr · {plan.max_members} members · {plan.max_active_jobs} jobs
                      </p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button variant="ghost" size="icon-sm" onClick={() => openEdit(plan)} title="Edit">
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon-sm" onClick={() => handleDelete(plan.id)} title="Delete" className="text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Editor */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              {editingId ? 'Edit Plan' : 'New Plan'}
              {editingId && (
                <Button variant="ghost" size="icon-sm" onClick={() => setEditingId(null)} className="ml-auto">
                  <X className="w-4 h-4" />
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Name</Label>
                <Input value={form.name} onChange={(e) => {
                  setForm(p => ({ ...p, name: e.target.value }));
                  if (!editingId) setForm(p => ({ ...p, slug: slugify(e.target.value) }));
                }} placeholder="Pro" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Slug</Label>
                <Input value={form.slug} onChange={(e) => setForm(p => ({ ...p, slug: slugify(e.target.value) }))} placeholder="pro" className="font-mono text-xs" />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))} rows={2} placeholder="Advanced tools for growing organizations" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Monthly Price ($)</Label>
                <Input type="number" min={0} value={form.price_monthly} onChange={(e) => setForm(p => ({ ...p, price_monthly: Number(e.target.value) }))} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Yearly Price ($)</Label>
                <Input type="number" min={0} value={form.price_yearly} onChange={(e) => setForm(p => ({ ...p, price_yearly: Number(e.target.value) }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Max Members</Label>
                <Input type="number" min={1} value={form.max_members} onChange={(e) => setForm(p => ({ ...p, max_members: Number(e.target.value) }))} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Max Active Jobs</Label>
                <Input type="number" min={1} value={form.max_active_jobs} onChange={(e) => setForm(p => ({ ...p, max_active_jobs: Number(e.target.value) }))} />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={form.is_active} onCheckedChange={(v) => setForm(p => ({ ...p, is_active: v }))} />
              <Label className="text-xs">Active (available for selection)</Label>
            </div>
            <Button onClick={handleSave} disabled={saving} className="w-full">
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              {editingId ? 'Update Plan' : 'Create Plan'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

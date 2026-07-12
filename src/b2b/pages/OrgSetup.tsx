// ============================================================
// OrgSetup — Multi-step org onboarding wizard for new firm signups
// ============================================================

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { createOrg } from '../lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Building2, Loader2, Check, ArrowRight, ArrowLeft, Users, Sparkles, Shield, UserPlus, Mail } from 'lucide-react';
import { toast } from 'sonner';

const STEPS = [
  { title: 'Company Info', description: 'Tell us about your organization' },
  { title: 'Team', description: 'Invite your first team members' },
  { title: 'Review', description: 'Verify and launch' },
];

const INDUSTRIES = [
  'Technology', 'Education', 'Healthcare', 'Finance', 'Consulting',
  'Creative / Design', 'Marketing', 'Non-profit', 'E-commerce', 'Other',
];

const SIZES = ['1-10', '11-50', '51-200', '201-500', '500+'];

export default function OrgSetup() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [step, setStep] = useState(0);
  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState({
    name: profile?.company_name || '',
    industry: '',
    size: '',
    description: '',
    website_url: '',
  });
  const [inviteEmail, setInviteEmail] = useState('');
  const [invitees, setInvitees] = useState<string[]>([]);

  const updateField = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleCreateOrg = async () => {
    if (!form.name.trim()) {
      toast.error('Organization name is required');
      return;
    }

    try {
      setIsCreating(true);
      await createOrg({
        name: form.name.trim(),
        industry: form.industry || undefined,
        size: form.size || undefined,
        description: form.description || undefined,
        website_url: form.website_url || undefined,
      });
      toast.success('Organization created successfully!');
      navigate('/b2b/dashboard');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create organization';
      toast.error(message);
    } finally {
      setIsCreating(false);
    }
  };

  const canProceed = () => {
    if (step === 0) return form.name.trim().length > 0;
    return true;
  };

  const addInvitee = () => {
    const email = inviteEmail.trim().toLowerCase();
    if (!email || !email.includes('@')) { toast.error('Enter a valid email'); return; }
    if (invitees.includes(email)) { toast.error('Already added'); return; }
    setInvitees(prev => [...prev, email]);
    setInviteEmail('');
  };

  const removeInvitee = (email: string) => {
    setInvitees(prev => prev.filter(e => e !== email));
  };

  return (
    <div className="min-h-screen pt-16 bg-gradient-to-b from-purple-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Steps indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                i <= step
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-200 text-gray-400'
              }`}>
                {i < step ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div className={`w-12 h-0.5 transition-colors ${
                  i < step ? 'bg-purple-600' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>

        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                {step === 0 ? <Building2 className="w-6 h-6 text-purple-600" /> :
                 step === 1 ? <Users className="w-6 h-6 text-purple-600" /> :
                 <Sparkles className="w-6 h-6 text-purple-600" />}
              </div>
            </div>
            <CardTitle className="text-xl">{STEPS[step].title}</CardTitle>
            <CardDescription>{STEPS[step].description}</CardDescription>
          </CardHeader>

          <CardContent>
            {step === 0 && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Organization Name *</Label>
                  <Input
                    id="name"
                    placeholder="Acme Corp"
                    value={form.name}
                    onChange={(e) => updateField('name', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="industry">Industry</Label>
                  <Select value={form.industry} onValueChange={(v) => updateField('industry', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select industry" />
                    </SelectTrigger>
                    <SelectContent>
                      {INDUSTRIES.map(ind => (
                        <SelectItem key={ind} value={ind}>{ind}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="size">Company Size</Label>
                  <Select value={form.size} onValueChange={(v) => updateField('size', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select size" />
                    </SelectTrigger>
                    <SelectContent>
                      {SIZES.map(sz => (
                        <SelectItem key={sz} value={sz}>{sz} employees</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    placeholder="What does your organization do?"
                    value={form.description}
                    onChange={(e) => updateField('description', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    placeholder="https://example.com"
                    value={form.website_url}
                    onChange={(e) => updateField('website_url', e.target.value)}
                  />
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-4">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Label>Invite team members via email</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        value={inviteEmail}
                        onChange={e => setInviteEmail(e.target.value)}
                        placeholder="colleague@company.com"
                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addInvitee(); } }}
                      />
                      <Button variant="outline" onClick={addInvitee} type="button" className="shrink-0">
                        <Mail className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
                {invitees.length > 0 && (
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Invited ({invitees.length})</Label>
                    {invitees.map(email => (
                      <div key={email} className="flex items-center justify-between p-2 rounded bg-muted/50 text-sm">
                        <div className="flex items-center gap-2">
                          <Mail className="w-3 h-3 text-muted-foreground" />
                          {email}
                        </div>
                        <button onClick={() => removeInvitee(email)} className="text-destructive hover:text-destructive/80 text-xs font-medium">Remove</button>
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  You can also invite more people later from the Team settings page.
                </p>
              </div>
            )}

            {step === 2 && (
              <div className="text-center py-4 space-y-4">
                <Sparkles className="w-10 h-10 text-purple-600 mx-auto" />
                <div>
                  <p className="font-medium text-gray-900">Ready to launch!</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Your organization <strong>"{form.name || 'Untitled'}"</strong> will be created with the Free plan.
                  </p>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-left text-sm text-amber-800">
                  <div className="flex items-start gap-2">
                    <Shield className="w-4 h-4 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-medium text-xs">Next step: Business verification</p>
                      <p className="text-xs mt-1">After setup, verify your business from the Compliance tab to unlock paid subscriptions and all features.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation buttons */}
            <div className="flex justify-between mt-6 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => step === 0 ? navigate('/dashboard') : setStep(s => s - 1)}
                disabled={isCreating}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                {step === 0 ? 'Cancel' : 'Back'}
              </Button>

              {step < STEPS.length - 1 ? (
                <Button onClick={() => setStep(s => s + 1)} disabled={!canProceed()}>
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button onClick={handleCreateOrg} disabled={isCreating}>
                  {isCreating ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating...</>
                  ) : (
                    <>Create Organization</>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

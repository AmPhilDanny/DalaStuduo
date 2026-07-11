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
import { Building2, Loader2, Check, ArrowRight, ArrowLeft, Users, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

const STEPS = [
  { title: 'Company Info', description: 'Tell us about your organization' },
  { title: 'Team', description: 'Set up your team (optional)' },
  { title: 'Launch', description: 'You\'re all set!' },
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white flex items-center justify-center p-4">
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
              <div className="text-center py-6 space-y-4">
                <Users className="w-12 h-12 text-purple-600 mx-auto" />
                <div>
                  <p className="text-sm text-gray-600">
                    You can invite team members after setting up your organization.
                  </p>
                  <p className="text-xs text-gray-400 mt-2">
                    Go to Team settings from the dashboard to send invitations.
                  </p>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="text-center py-6 space-y-4">
                <Sparkles className="w-12 h-12 text-purple-600 mx-auto" />
                <div>
                  <p className="font-medium text-gray-900">Ready to launch!</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Your organization "{form.name || 'Untitled'}" will be created with the Free plan.
                    You can upgrade anytime.
                  </p>
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

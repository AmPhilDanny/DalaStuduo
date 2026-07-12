import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Sparkles, Link2, Check, ArrowRight, ArrowLeft, Loader2,
  Briefcase, GraduationCap, Globe, Code, Palette, PenTool,
} from 'lucide-react';
import { toast } from 'sonner';

type Role = 'student' | 'freelancer' | 'employer' | '';

const INTERESTS = [
  { id: 'jobs', label: 'Job Listings', icon: Briefcase },
  { id: 'talent', label: 'Finding Talent', icon: Globe },
  { id: 'projects', label: 'Project Work', icon: Code },
  { id: 'tutoring', label: 'Learning & Tutoring', icon: GraduationCap },
  { id: 'marketplace', label: 'Digital Marketplace', icon: Palette },
  { id: 'freelance', label: 'Freelance Gigs', icon: PenTool },
];

const STEPS = [
  { title: 'Welcome', subtitle: 'Tell us about yourself' },
  { title: 'Interests', subtitle: 'What brings you here?' },
  { title: 'Connect', subtitle: 'Link your profiles (optional)' },
  { title: 'Ready', subtitle: 'You\'re all set!' },
];

const roleIcons: Record<string, typeof Briefcase> = {
  student: GraduationCap,
  freelancer: Briefcase,
  employer: Briefcase,
};

export default function Onboarding() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [name, setName] = useState(profile?.full_name || '');
  const [role, setRole] = useState<Role>('');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [linkedin, setLinkedin] = useState('');
  const [github, setGithub] = useState('');
  const [portfolio, setPortfolio] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const progress = ((step + 1) / STEPS.length) * 100;

  const toggleInterest = (id: string) => {
    setSelectedInterests((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const canNext = () => {
    if (step === 0) return name.trim().length > 0 && role !== '';
    if (step === 1) return selectedInterests.length > 0;
    return true;
  };

  const handleComplete = async () => {
    setIsSaving(true);
    try {
      // Save to localStorage
      localStorage.setItem('onboarding_complete', 'true');
      localStorage.setItem('onboarding_role', role);
      localStorage.setItem('onboarding_interests', JSON.stringify(selectedInterests));

      // Attempt to update profile in Supabase
      if (user) {
        const payload: Record<string, unknown> = {
          id: user.id,
          full_name: name,
          role,
          onboarding_completed: true,
          interests: selectedInterests,
        };
        if (linkedin) payload.linkedin_url = linkedin;
        if (github) payload.github_url = github;
        if (portfolio) payload.portfolio_url = portfolio;

        await supabase.from('profiles').upsert(payload as never);
      }

      toast.success('Welcome aboard! Your profile is set up.');
      navigate('/dashboard');
    } catch (err) {
      console.error('Onboarding save error:', err);
      // Still navigate — localStorage is enough for the guard
      navigate('/dashboard');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        {/* Step indicator */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            {STEPS.map((s, i) => (
              <div key={i} className="flex flex-col items-center">
                <div
                  className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors
                    ${i < step ? 'bg-primary text-primary-foreground' : ''}
                    ${i === step ? 'bg-primary text-primary-foreground ring-4 ring-primary/20' : ''}
                    ${i > step ? 'bg-muted text-muted-foreground' : ''}
                  `}
                >
                  {i < step ? <Check className="h-4 w-4" /> : i + 1}
                </div>
                <span className="text-xs text-muted-foreground mt-1 hidden sm:block">{s.title}</span>
              </div>
            ))}
          </div>
          <Progress value={progress} className="h-1.5" />
        </div>

        <AnimatePresence mode="wait">
          {/* Step 0: Welcome / Name & Role */}
          {step === 0 && (
            <motion.div key="step0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <Card>
                <CardHeader>
                  <CardTitle>Welcome to Dala!</CardTitle>
                  <CardDescription>Let's set up your profile so we can personalize your experience.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="name">What's your name?</Label>
                    <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter your full name" autoFocus />
                  </div>
                  <div className="space-y-2">
                    <Label>I am a...</Label>
                    <div className="grid grid-cols-3 gap-3">
                      {(['student', 'freelancer', 'employer'] as const).map((r) => {
                        const Icon = roleIcons[r] || User;
                        return (
                          <button
                            key={r}
                            type="button"
                            onClick={() => setRole(r)}
                            className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all
                              ${role === r ? 'border-primary bg-primary/5' : 'border-muted hover:border-muted-foreground/30'}`}
                          >
                            <Icon className={`h-6 w-6 ${role === r ? 'text-primary' : 'text-muted-foreground'}`} />
                            <span className="text-sm font-medium capitalize">{r}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 1: Interests */}
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <Card>
                <CardHeader>
                  <CardTitle>What interests you?</CardTitle>
                  <CardDescription>Select all that apply — we'll tailor your experience.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    {INTERESTS.map((item) => {
                      const Icon = item.icon;
                      const isSelected = selectedInterests.includes(item.id);
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => toggleInterest(item.id)}
                          className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all text-left
                            ${isSelected ? 'border-primary bg-primary/5' : 'border-muted hover:border-muted-foreground/30'}`}
                        >
                          <Icon className={`h-5 w-5 shrink-0 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                          <span className="text-sm font-medium">{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 2: Social Links */}
          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <Card>
                <CardHeader>
                  <CardTitle>Connect your profiles</CardTitle>
                  <CardDescription>Optional — helps employers and collaborators learn more about you.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="linkedin">LinkedIn URL</Label>
                    <Input id="linkedin" value={linkedin} onChange={(e) => setLinkedin(e.target.value)} placeholder="https://linkedin.com/in/..." />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="github">GitHub URL</Label>
                    <Input id="github" value={github} onChange={(e) => setGithub(e.target.value)} placeholder="https://github.com/..." />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="portfolio">Portfolio URL</Label>
                    <Input id="portfolio" value={portfolio} onChange={(e) => setPortfolio(e.target.value)} placeholder="https://..." />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 3: Done */}
          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
              <Card>
                <CardHeader className="text-center">
                  <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <CardTitle className="text-2xl">You're all set, {name.split(' ')[0]}!</CardTitle>
                  <CardDescription>Here's what you can do next:</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button className="w-full justify-start" variant="outline" onClick={() => navigate('/jobs')}>
                    <Briefcase className="h-4 w-4 mr-2" /> Browse Jobs
                  </Button>
                  <Button className="w-full justify-start" variant="outline" onClick={() => navigate('/dashboard')}>
                    <User className="h-4 w-4 mr-2" /> Go to Dashboard
                  </Button>
                  <Button className="w-full justify-start" variant="outline" onClick={() => navigate('/talent')}>
                    <Globe className="h-4 w-4 mr-2" /> Explore Talent
                  </Button>
                  <Button className="w-full mt-4" onClick={handleComplete} disabled={isSaving}>
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    {isSaving ? 'Saving...' : 'Get Started'}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex justify-between mt-6">
          <Button variant="ghost" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>
          {step < 3 ? (
            <Button onClick={() => setStep((s) => s + 1)} disabled={!canNext()}>
              Next <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <div />
          )}
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Building2, Users, Briefcase, Eye, Plus, ArrowRight, Settings, FileText, Search, ShieldCheck, CreditCard, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { getVerification } from '@/b2b/lib/api';
import { useSubscription } from '@/b2b/hooks/useSubscription';
import type { OrgVerification } from '@/b2b/lib/api';

interface OrgJob {
  id: string;
  title: string;
  type: string;
  location: string;
  is_active: boolean;
  created_at: string;
  applications: { count: number }[];
}

interface Applicant {
  id: string;
  job_id: string;
  status: string;
  created_at: string;
  student_id: string;
  profiles: { full_name: string; headline: string; avatar_url: string | null } | null;
  jobs: { title: string } | null;
}

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-400',
  reviewed: 'bg-blue-500/15 text-blue-700 dark:text-blue-400',
  interviewed: 'bg-purple-500/15 text-purple-700 dark:text-purple-400',
  accepted: 'bg-green-500/15 text-green-700 dark:text-green-400',
  rejected: 'bg-red-500/15 text-red-700 dark:text-red-400',
};

export default function OrgDashboard() {
  const { user, profile } = useAuth();
  const { plan: currentPlan, subscription } = useSubscription();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<OrgJob[]>([]);
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [verification, setVerification] = useState<OrgVerification | null>(null);
  const [verificationLoading, setVerificationLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchDashboardData = async () => {
    try {
      const [jobsRes, appsRes] = await Promise.all([
        supabase
          .from('jobs')
          .select('id, title, type, location, is_active, created_at, applications:applications(count)')
          .eq('company_id', user!.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('applications')
          .select('id, job_id, status, created_at, student_id, profiles:student_id(full_name, headline, avatar_url), jobs:job_id(title)')
          .order('created_at', { ascending: false })
          .limit(10),
      ]);

      if (jobsRes.error) throw jobsRes.error;
      if (appsRes.error) throw appsRes.error;

      setJobs((jobsRes.data || []) as unknown as OrgJob[]);
      setApplicants((appsRes.data || []) as unknown as Applicant[]);
    } catch {
      toast.error('Failed to load dashboard data');
    }
  };

    fetchDashboardData();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const fetchVerificationStatus = async () => {
      try {
        const res = await getVerification();
        setVerification(res.data);
      } catch {
        // no verification exists yet
      } finally {
        setVerificationLoading(false);
      }
    };
    fetchVerificationStatus();
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen pt-24 pb-12 px-4">
        <div className="container mx-auto max-w-6xl text-center py-24">
          <Building2 className="w-16 h-16 text-secondary mx-auto mb-6" />
          <h1 className="text-3xl font-bold mb-3">Organization Dashboard</h1>
          <p className="text-muted-foreground mb-6">Sign in to manage your organization.</p>
          <Button onClick={() => navigate('/auth')}>Sign In</Button>
        </div>
      </div>
    );
  }

  const activeJobs = jobs.filter(j => j.is_active);
  const totalApplicants = applicants.length;
  const interviewsScheduled = applicants.filter(a => a.status === 'interviewed').length;

  return (
    <div className="min-h-screen pt-24 pb-12 px-4">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-primary mb-1">
              {profile?.company_name || 'Organization Dashboard'}
            </h1>
            <p className="text-muted-foreground">
              {profile?.headline || 'Manage your jobs and applicants'}
            </p>
          </div>
          <Button onClick={() => navigate('/jobs/new')}>
            <Plus className="w-4 h-4 mr-2" />
            Post New Job
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Jobs</CardTitle>
              <Briefcase className="w-4 h-4 text-secondary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{activeJobs.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {jobs.length - activeJobs.length} inactive
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Applicants</CardTitle>
              <Users className="w-4 h-4 text-secondary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalApplicants}</div>
              <p className="text-xs text-muted-foreground mt-1">Across all jobs</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Interviews</CardTitle>
              <Eye className="w-4 h-4 text-secondary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{interviewsScheduled}</div>
              <p className="text-xs text-muted-foreground mt-1">Scheduled interviews</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
          {/* Your Jobs */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-secondary" />
                  Your Jobs
                </CardTitle>
              </CardHeader>
              <CardContent>
                {jobs.length === 0 ? (
                  <div className="text-center py-12">
                    <Search className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground mb-4">No jobs posted yet</p>
                    <Button onClick={() => navigate('/jobs/new')}>
                      <Plus className="w-4 h-4 mr-2" />
                      Post Your First Job
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {jobs.map((job) => (
                      <div key={job.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                        <div>
                          <p className="font-medium text-sm">{job.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {job.type} &middot; {job.location}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-muted-foreground">
                            {job.applications?.[0]?.count || 0} applicants
                          </span>
                          <Badge variant={job.is_active ? 'default' : 'secondary'}>
                            {job.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Applicants */}
            {applicants.length > 0 && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-secondary" />
                    Recent Applicants
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {applicants.slice(0, 5).map((app) => (
                      <div key={app.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                        <div>
                          <p className="font-medium text-sm">{app.profiles?.full_name || 'Unknown'}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Applied to: {app.jobs?.title || 'Unknown'} &middot; {new Date(app.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge className={STATUS_STYLES[app.status] || ''} variant="secondary">
                          {app.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Quick Actions & Profile */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/jobs/new')}>
                  <Plus className="w-4 h-4 mr-2" />
                  Post New Job
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/profile')}>
                  <Settings className="w-4 h-4 mr-2" />
                  Edit Company Profile
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/jobs')}>
                  <Eye className="w-4 h-4 mr-2" />
                  View All Jobs
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/org/verification')}>
                  <ShieldCheck className="w-4 h-4 mr-2" />
                  Organization Verification
                </Button>
              </CardContent>
            </Card>

            {/* Subscription Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-secondary" />
                  Subscription
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Current plan</span>
                  <Badge variant="secondary" className="text-xs">
                    {currentPlan?.name || 'Free'}
                  </Badge>
                </div>
                {subscription?.status === 'expired' && (
                  <p className="text-xs text-red-500 mb-2">Subscription expired</p>
                )}
                <Button variant="link" className="px-0 mt-1" onClick={() => navigate('/b2b/settings')}>
                  Manage Plan
                  <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </CardContent>
            </Card>

            {/* Verification Status Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-secondary" />
                  Verification
                </CardTitle>
              </CardHeader>
              <CardContent>
                {verificationLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-secondary" />
                ) : (
                  <>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Status</span>
                      <Badge variant={verification?.status === 'verified' ? 'default' : verification?.status === 'rejected' ? 'destructive' : 'secondary'} className="text-xs">
                        {verification?.status === 'verified' ? 'Verified' : verification?.status === 'pending' ? 'Pending' : verification?.status === 'rejected' ? 'Rejected' : 'Not Submitted'}
                      </Badge>
                    </div>
                    <Button variant="link" className="px-0 mt-1" onClick={() => navigate('/b2b/compliance')}>
                      {verification?.status === 'verified' ? 'View Details' : verification?.status === 'pending' ? 'Check Status' : 'Apply for Verification'}
                      <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Company Profile Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-secondary" />
                  Company Profile
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-medium">{profile?.company_name || 'No company name set'}</p>
                {profile?.headline && (
                  <p className="text-sm text-muted-foreground mt-1">{profile.headline}</p>
                )}
                {profile?.location && (
                  <p className="text-xs text-muted-foreground mt-2">{profile.location}</p>
                )}
                <Button variant="link" className="px-0 mt-2" onClick={() => navigate('/profile')}>
                  Edit Profile
                  <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

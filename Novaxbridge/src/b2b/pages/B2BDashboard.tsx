// ============================================================
// B2BDashboard — Premium organization dashboard
// ============================================================

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useOrg } from '../hooks/useOrg';
import { useSubscription } from '../hooks/useSubscription';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Building2, Users, Briefcase, Eye, Plus, ArrowRight,
  Mail, Search, TrendingUp, UserPlus, Sparkles, Loader2,
  FileText, Settings, BarChart3,
} from 'lucide-react';

interface OrgStat {
  activeJobs: number;
  totalJobs: number;
  teamMembers: number;
  applications: number;
  talentMatches: number;
  interviews: number;
}

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
  pending: 'bg-yellow-500/15 text-yellow-700',
  reviewed: 'bg-blue-500/15 text-blue-700',
  interviewed: 'bg-purple-500/15 text-purple-700',
  accepted: 'bg-green-500/15 text-green-700',
  rejected: 'bg-red-500/15 text-red-700',
};

export default function B2BDashboard() {
  const { org, role } = useOrg();
  const { plan } = useSubscription();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<OrgStat>({
    activeJobs: 0, totalJobs: 0, teamMembers: 0, applications: 0, talentMatches: 0, interviews: 0,
  });
  const [jobs, setJobs] = useState<OrgJob[]>([]);
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetchDashboard();
  }, [org?.id, user]);

  const fetchDashboard = async () => {
    try {
      const db = supabase as any;

      const queries: any[] = [];

      // B2B org stats (if org exists)
      if (org?.id) {
        queries.push(
          db.from('jobs').select('id, is_active', { count: 'exact' }).eq('org_id', org.id),
          db.from('org_members').select('id', { count: 'exact' }).eq('org_id', org.id),
          db.from('orders').select('id', { count: 'exact' }).eq('org_id', org.id),
        );
      } else {
        queries.push(
          Promise.resolve({ data: [], count: 0 }),
          Promise.resolve({ data: [], count: 0 }),
          Promise.resolve({ data: [], count: 0 }),
        );
      }

      // Legacy jobs (company_id) for fallback
      queries.push(
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
        supabase
          .from('profiles')
          .select('id', { count: 'exact', head: true })
          .eq('role', 'student'),
      );

      const [jobsOrgRes, membersRes, appsOrgRes, legacyJobsRes, appsRes, talentRes] = await Promise.all(queries);

      // Merge stats
      const orgJobs = jobsOrgRes.data || [];
      const legacyJobs = (legacyJobsRes.data || []) as unknown as OrgJob[];
      const allJobs = org?.id ? orgJobs : legacyJobs;

      setStats({
        activeJobs: allJobs.filter((j: any) => j.is_active).length,
        totalJobs: allJobs.length,
        teamMembers: membersRes.count || 0,
        applications: appsOrgRes.count || 0,
        talentMatches: talentRes.count || 0,
        interviews: (appsRes.data || []).filter((a: any) => a.status === 'interviewed').length,
      });

      setJobs((legacyJobsRes.data || []) as unknown as OrgJob[]);
      setApplicants((appsRes.data || []) as unknown as Applicant[]);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
      </div>
    );
  }

  const showUpgrade = plan?.slug === 'free' || !plan;

  // ── Derived organization metrics ──
  const appsPerJob = stats.activeJobs > 0 ? (stats.applications / stats.activeJobs).toFixed(1) : '—';
  const interviewRate = stats.applications > 0 ? Math.round((stats.interviews / stats.applications) * 100) : 0;
  const activeRatio = stats.totalJobs > 0 ? Math.round((stats.activeJobs / stats.totalJobs) * 100) : 0;

  return (
    <div className="space-y-8">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {org?.name || profile?.company_name || 'Organization Dashboard'}
          </h1>
          <p className="text-gray-500 mt-1">
            {role === 'owner' ? 'Owner' : role === 'admin' ? 'Admin' : 'Member'} account
            {profile?.headline && <span className="ml-2 text-gray-400">&middot; {profile.headline}</span>}
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => navigate('/b2b/team')}>
            <UserPlus className="w-4 h-4 mr-2" />
            Invite Member
          </Button>
          <Button onClick={() => navigate('/b2b/hiring')}>
            <Plus className="w-4 h-4 mr-2" />
            Post Job
          </Button>
        </div>
      </div>

      {/* ── Upgrade prompt ── */}
      {showUpgrade && (
        <Card className="border-purple-200 bg-purple-50">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-purple-900">You're on the Free plan</p>
                <p className="text-xs text-purple-600">Upgrade to unlock talent pool, analytics, and AI insights</p>
              </div>
            </div>
            <Button size="sm" className="bg-purple-600 hover:bg-purple-700" onClick={() => navigate('/b2b/settings')}>
              Upgrade
              <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ── Stats ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Active Jobs</CardTitle>
            <Briefcase className="w-4 h-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats.activeJobs}</div>
            <p className="text-xs text-gray-400 mt-1">{stats.totalJobs} total posted</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Team Members</CardTitle>
            <Users className="w-4 h-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats.teamMembers}</div>
            <p className="text-xs text-gray-400 mt-1">
              <Button variant="link" className="px-0 h-auto text-xs" onClick={() => navigate('/b2b/team')}>
                Manage team
              </Button>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Applications</CardTitle>
            <Eye className="w-4 h-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats.applications}</div>
            <p className="text-xs text-gray-400 mt-1">Across all listings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Talent Pool</CardTitle>
            <Search className="w-4 h-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats.talentMatches}</div>
            <p className="text-xs text-gray-400 mt-1">
              <Button variant="link" className="px-0 h-auto text-xs" onClick={() => navigate('/b2b/talent')}>
                Browse talent
              </Button>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ── Main content grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column — Jobs + Applicants */}
        <div className="lg:col-span-2 space-y-6">
          {/* Your Jobs */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-purple-600" />
                Your Jobs
              </CardTitle>
            </CardHeader>
            <CardContent>
              {jobs.length === 0 ? (
                <div className="text-center py-10">
                  <Search className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-400 mb-4">No jobs posted yet</p>
                  <Button onClick={() => navigate('/b2b/hiring')}>
                    <Plus className="w-4 h-4 mr-2" />
                    Post Your First Job
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {jobs.slice(0, 5).map((job) => (
                    <div key={job.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm text-gray-900 truncate">{job.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {job.type} &middot; {job.location}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 ml-3">
                        <span className="text-xs text-gray-500 whitespace-nowrap">
                          {job.applications?.[0]?.count || 0} applicant{(job.applications?.[0]?.count || 0) !== 1 ? 's' : ''}
                        </span>
                        <Badge variant={job.is_active ? 'default' : 'secondary'} className={job.is_active ? 'bg-green-100 text-green-700' : ''}>
                          {job.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  {jobs.length > 5 && (
                    <Button variant="link" className="w-full mt-2 text-sm" onClick={() => navigate('/b2b/hiring')}>
                      View all {jobs.length} jobs
                      <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Applicants */}
          {applicants.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  Recent Applicants
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {applicants.slice(0, 5).map((app) => (
                    <div key={app.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm text-gray-900">{app.profiles?.full_name || 'Unknown'}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Applied to: {app.jobs?.title || 'Unknown'} &middot; {new Date(app.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge className={`${STATUS_STYLES[app.status] || ''} ml-3`} variant="secondary">
                        {app.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right column — Quick Actions + AI Insights + Company Profile */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/b2b/hiring')}>
                <Plus className="w-4 h-4 mr-2" />
                Post a New Job
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/b2b/team')}>
                <UserPlus className="w-4 h-4 mr-2" />
                Invite Team Member
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/b2b/talent')}>
                <Search className="w-4 h-4 mr-2" />
                Search Talent Pool
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/b2b/settings')}>
                <Building2 className="w-4 h-4 mr-2" />
                Organization Settings
              </Button>
            </CardContent>
          </Card>

          {/* Company Profile */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Building2 className="w-4 h-5 text-purple-600" />
                Company Profile
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-medium text-gray-900">{profile?.company_name || org?.name || 'No company name set'}</p>
              {profile?.headline && (
                <p className="text-sm text-gray-500 mt-1">{profile.headline}</p>
              )}
              {profile?.location && (
                <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                  <Building2 className="w-3 h-3" /> {profile.location}
                </p>
              )}
              {profile?.bio && (
                <p className="text-xs text-gray-500 mt-2 line-clamp-2">{profile.bio}</p>
              )}
              <Button variant="link" className="px-0 mt-2 h-auto text-xs" onClick={() => navigate('/profile')}>
                Edit Profile
                <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </CardContent>
          </Card>

          {/* AI Insights */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-600" />
                AI Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {showUpgrade ? (
                  <div className="text-center py-6 text-gray-400">
                    <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Upgrade to a paid plan to unlock AI-powered insights</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="p-3 rounded-lg bg-purple-50 border border-purple-100">
                      <div className="flex items-start gap-3">
                        <TrendingUp className="w-4 h-4 text-purple-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-purple-900">Platform Activity</p>
                          <p className="text-xs text-purple-600 mt-1">
                            {stats.activeJobs > 0
                              ? `You have ${stats.activeJobs} active position${stats.activeJobs > 1 ? 's' : ''} with ${stats.applications} total application${stats.applications !== 1 ? 's' : ''}.`
                              : 'Post your first job to start receiving applications.'}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-blue-50 border border-blue-100">
                      <div className="flex items-start gap-3">
                        <Users className="w-4 h-4 text-blue-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-blue-900">Team Size</p>
                          <p className="text-xs text-blue-600 mt-1">
                            Your organization has {stats.teamMembers} member{stats.teamMembers !== 1 ? 's' : ''}.
                            {role === 'owner' || role === 'admin'
                              ? ' Invite more team members to scale operations.'
                              : ''}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── Organization Metrics ── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-600" />
            Organization Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Apps per Job</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{appsPerJob}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {stats.activeJobs > 0
                  ? `${stats.applications} apps ÷ ${stats.activeJobs} active jobs`
                  : 'No active jobs to measure'}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Interview Rate</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold text-gray-900">{interviewRate}%</span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                {stats.applications > 0
                  ? `${stats.interviews} interviewed of ${stats.applications} applicants`
                  : 'No applications yet'}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Active Ratio</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold text-gray-900">{activeRatio}%</span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                {stats.totalJobs > 0
                  ? `${stats.activeJobs} active of ${stats.totalJobs} total`
                  : 'No jobs posted'}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Team</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.teamMembers}</p>
              <p className="text-xs text-gray-400 mt-0.5">Current members</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

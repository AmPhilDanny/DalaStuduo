// ============================================================
// B2BDashboard — Premium organization dashboard (Sprint 9b)
// Features: gradient header, branded stat cards, org health ring,
//           hiring funnel & job trend charts, AI insights
// ============================================================

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useOrg } from '../hooks/useOrg';
import { useSubscription } from '../hooks/useSubscription';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Building2, Users, Briefcase, Eye, Plus, ArrowRight,
  Mail, Search, TrendingUp, UserPlus, Sparkles, Loader2,
  BarChart3, Activity, FileText,
} from 'lucide-react';
import StatCard from '../components/dashboard/StatCard';
import OrgHealthRing from '../components/dashboard/OrgHealthRing';
import HiringFunnelChart from '../components/dashboard/HiringFunnelChart';
import JobTrendChart from '../components/dashboard/JobTrendChart';
import AiInsights from '../components/dashboard/AiInsights';
import ActivityFeed from '../components/dashboard/ActivityFeed';

interface OrgStat {
  activeJobs: number;
  totalJobs: number;
  teamMembers: number;
  applications: number;
  talentMatches: number;
  totalContracts: number;
}

export default function B2BDashboard() {
  const { org, role } = useOrg();
  const { plan, subscription } = useSubscription();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<OrgStat>({
    activeJobs: 0, totalJobs: 0, teamMembers: 0,
    applications: 0, talentMatches: 0, totalContracts: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!org?.id || !user) {
      setIsLoading(false);
      return;
    }

    const fetchStats = async () => {
      try {
        const [jobsRes, membersRes, appsRes, talentRes, contractsRes] = await Promise.all([
          supabase.from('jobs')
            .select('id, is_active', { count: 'exact' })
            .eq('org_id', org.id),
          supabase.from('org_members')
            .select('id', { count: 'exact' })
            .eq('org_id', org.id),
          supabase.from('orders')
            .select('id', { count: 'exact' })
            .eq('org_id', org.id),
          supabase
            .from('profiles')
            .select('id', { count: 'exact', head: true })
            .eq('role', 'student'),
          supabase.from('contracts')
            .select('id', { count: 'exact' })
            .eq('org_id', org.id),
        ]);

        const jobs = jobsRes.data || [];
        setStats({
          activeJobs: jobs.filter((j: { is_active: boolean }) => j.is_active).length,
          totalJobs: jobs.length,
          teamMembers: membersRes.count || 0,
          applications: appsRes.count || 0,
          talentMatches: talentRes.count || 0,
          totalContracts: contractsRes.count || 0,
        });
      } catch (err) {
        console.error('Failed to load dashboard stats:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [org?.id, user]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600 mx-auto" />
          <p className="text-sm text-gray-400 mt-2">Loading dashboard…</p>
        </div>
      </div>
    );
  }

  const showUpgrade = plan?.slug === 'free' || !plan;
  const orgHealth = Math.min(
    100,
    Math.round(
      (stats.activeJobs / Math.max(stats.totalJobs, 1)) * 30 +
      (stats.teamMembers / 5) * 25 +
      (stats.applications / 10) * 25 +
      (stats.totalContracts / 3) * 20
    )
  );

  return (
    <div className="space-y-8">
      {/* ── Premium Gradient Header ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-700 via-purple-600 to-indigo-700 p-6 sm:p-8 text-white">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-1/3 w-48 h-48 bg-white/5 rounded-full translate-y-1/2" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                {org?.name || 'Organization Dashboard'}
              </h1>
              <Badge className="bg-white/20 text-white border-0 text-xs font-medium capitalize">
                {role || 'member'}
              </Badge>
            </div>
            <p className="text-purple-100 text-sm flex items-center gap-4">
              <span className="flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5" />
                {plan?.name || 'Free'} plan
              </span>
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              className="bg-white/15 hover:bg-white/25 text-white border-0"
              onClick={() => navigate('/b2b/team')}
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Invite
            </Button>
            <Button
              className="bg-white text-purple-700 hover:bg-purple-50"
              onClick={() => navigate('/b2b/hiring')}
            >
              <Plus className="w-4 h-4 mr-2" />
              Post Job
            </Button>
          </div>
        </div>
      </div>

      {/* ── Upgrade Prompt ── */}
      {showUpgrade && (
        <div className="rounded-xl border border-purple-200 bg-purple-50 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-purple-600" />
            <div>
              <p className="text-sm font-semibold text-purple-900">You're on the Free plan</p>
              <p className="text-xs text-purple-600">Upgrade to unlock talent pool, analytics, and AI insights</p>
            </div>
          </div>
          <Button size="sm" className="bg-purple-600 hover:bg-purple-700 shrink-0" onClick={() => navigate('/b2b/settings')}>
            Upgrade
            <ArrowRight className="w-3 h-3 ml-1" />
          </Button>
        </div>
      )}

      {/* ── Stats Grid (3x2) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          label="Active Jobs"
          value={stats.activeJobs}
          subtext={`${stats.totalJobs} total posted`}
          icon={<Briefcase className="w-5 h-5" />}
          accentColor="purple"
          trend={stats.totalJobs > 0 ? { direction: 'up', percent: Math.round((stats.activeJobs / stats.totalJobs) * 100) } : undefined}
          onClick={() => navigate('/b2b/hiring')}
        />
        <StatCard
          label="Team Members"
          value={stats.teamMembers}
          subtext="Collaborators"
          icon={<Users className="w-5 h-5" />}
          accentColor="blue"
          trend={stats.teamMembers > 0 ? { direction: 'up', percent: stats.teamMembers } : undefined}
          onClick={() => navigate('/b2b/team')}
        />
        <StatCard
          label="Applications"
          value={stats.applications}
          subtext="Across all listings"
          icon={<Eye className="w-5 h-5" />}
          accentColor="green"
          trend={stats.applications > 0 ? { direction: 'up', percent: Math.min(stats.applications * 10, 99) } : undefined}
          onClick={() => navigate('/b2b/hiring')}
        />
        <StatCard
          label="Talent Pool"
          value={stats.talentMatches}
          subtext="Available candidates"
          icon={<Search className="w-5 h-5" />}
          accentColor="amber"
          onClick={() => navigate('/b2b/talent')}
        />
        <StatCard
          label="Total Contracts"
          value={stats.totalContracts}
          subtext="All time contracts"
          icon={<FileText className="w-5 h-5" />}
          accentColor="purple"
          onClick={() => navigate('/b2b/contracts')}
        />
        <div className="bg-white rounded-xl border p-4 flex flex-col items-center justify-center">
          <OrgHealthRing score={orgHealth} label="Organization Health" sublabel="Based on activity & engagement" />
        </div>
      </div>

      {/* ── Charts Row ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {org?.id && <HiringFunnelChart orgId={org.id} />}
        {org?.id && <JobTrendChart orgId={org.id} />}
      </div>

      {/* ── Activity Feed + AI Insights ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {org?.id && (
          <div className="lg:col-span-2">
            <ActivityFeed orgId={org.id} />
          </div>
        )}
        <div className="space-y-6">
          {org?.id && <AiInsights orgId={org.id} planSlug={plan?.slug} />}

          {/* Quick Actions */}
          <div className="bg-white rounded-xl border p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Activity className="w-4 h-4 text-purple-600" />
              Quick Actions
            </h3>
            <div className="space-y-2">
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

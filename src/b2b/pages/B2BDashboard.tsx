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
} from 'lucide-react';

interface OrgStat {
  activeJobs: number;
  totalJobs: number;
  teamMembers: number;
  applications: number;
  talentMatches: number;
}

export default function B2BDashboard() {
  const { org, role } = useOrg();
  const { plan, subscription } = useSubscription();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<OrgStat>({
    activeJobs: 0, totalJobs: 0, teamMembers: 0, applications: 0, talentMatches: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!org?.id || !user) return;

    const fetchStats = async () => {
      try {
        // Cast needed until DB types are regenerated with new B2B tables
        const db = supabase as any;
        const [jobsRes, membersRes, appsRes, talentRes] = await Promise.all([
          db.from('jobs')
            .select('id, is_active', { count: 'exact' })
            .eq('org_id', org.id),
          db.from('org_members')
            .select('id', { count: 'exact' })
            .eq('org_id', org.id),
          db.from('orders')
            .select('id', { count: 'exact' })
            .eq('org_id', org.id),
          supabase
            .from('profiles')
            .select('id', { count: 'exact', head: true })
            .eq('role', 'student'),
        ]);

        const jobs = jobsRes.data || [];
        setStats({
          activeJobs: jobs.filter(j => j.is_active).length,
          totalJobs: jobs.length,
          teamMembers: membersRes.count || 0,
          applications: appsRes.count || 0,
          talentMatches: talentRes.count || 0,
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
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
      </div>
    );
  }

  const showUpgrade = plan?.slug === 'free' || !plan;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {org?.name || 'Organization Dashboard'}
          </h1>
          <p className="text-gray-500 mt-1">
            {role === 'owner' ? 'Owner' : role === 'admin' ? 'Admin' : 'Member'} account
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

      {/* Upgrade prompt */}
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

      {/* Stats */}
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

      {/* Quick actions + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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

        {/* AI Insights */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-600" />
              AI Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {showUpgrade ? (
                <div className="text-center py-8 text-gray-400">
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
  );
}

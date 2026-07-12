import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, UserPlus, FileText, CheckCircle, MessageSquare, Ban, Clock } from 'lucide-react';

interface ActivityEvent {
  id: string;
  type: 'member_joined' | 'contract_signed' | 'contract_completed' | 'application_received' | 'order_placed';
  title: string;
  description: string;
  timestamp: string;
  link?: string;
}

const EVENT_ICONS: Record<string, React.ReactNode> = {
  member_joined: <UserPlus className="h-4 w-4 text-green-600" />,
  contract_signed: <FileText className="h-4 w-4 text-blue-600" />,
  contract_completed: <CheckCircle className="h-4 w-4 text-emerald-600" />,
  application_received: <MessageSquare className="h-4 w-4 text-purple-600" />,
  order_placed: <Clock className="h-4 w-4 text-amber-600" />,
};

function relativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function groupEvents(events: ActivityEvent[]): { label: string; items: ActivityEvent[] }[] {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const yesterday = today - 86400000;
  const thisWeek = today - now.getDay() * 86400000;

  const groups: { label: string; items: ActivityEvent[] }[] = [];

  const todayItems = events.filter((e) => new Date(e.timestamp).getTime() >= today);
  if (todayItems.length) groups.push({ label: 'Today', items: todayItems });

  const yesterdayItems = events.filter(
    (e) => new Date(e.timestamp).getTime() >= yesterday && new Date(e.timestamp).getTime() < today
  );
  if (yesterdayItems.length) groups.push({ label: 'Yesterday', items: yesterdayItems });

  const weekItems = events.filter(
    (e) => new Date(e.timestamp).getTime() >= thisWeek && new Date(e.timestamp).getTime() < yesterday
  );
  if (weekItems.length) groups.push({ label: 'This Week', items: weekItems });

  const earlierItems = events.filter((e) => new Date(e.timestamp).getTime() < thisWeek);
  if (earlierItems.length) groups.push({ label: 'Earlier', items: earlierItems });

  return groups;
}

interface Props {
  orgId: string;
}

export default function ActivityFeed({ orgId }: Props) {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orgId) return;

    const fetchActivity = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [membersRes, contractsRes, appsRes] = await Promise.all([
          (supabase as never as { from: (t: string) => any })
            .from('org_members')
            .select('id, created_at, profiles!inner(full_name)')
            .eq('org_id', orgId)
            .order('created_at', { ascending: false })
            .limit(5),
          (supabase as never as { from: (t: string) => any })
            .from('contracts')
            .select('id, title, status, updated_at')
            .eq('org_id', orgId)
            .order('updated_at', { ascending: false })
            .limit(5),
          (supabase as never as { from: (t: string) => any })
            .from('orders')
            .select('id, title, status, updated_at')
            .eq('org_id', orgId)
            .order('updated_at', { ascending: false })
            .limit(5),
        ]);

        const mapped: ActivityEvent[] = [];

        (membersRes?.data || []).forEach((m: any) => {
          mapped.push({
            id: `member-${m.id}`,
            type: 'member_joined',
            title: 'Team member joined',
            description: `${m.profiles?.full_name || 'Someone'} joined the organization`,
            timestamp: m.created_at,
          });
        });

        (contractsRes?.data || []).forEach((c: any) => {
          const type = c.status === 'completed' ? 'contract_completed' : 'contract_signed';
          mapped.push({
            id: `contract-${c.id}-${c.status}`,
            type,
            title: `Contract ${c.status === 'completed' ? 'completed' : 'signed'}`,
            description: c.title || `Contract #${c.id.slice(0, 8)}`,
            timestamp: c.updated_at,
          });
        });

        (appsRes?.data || []).forEach((o: any) => {
          mapped.push({
            id: `order-${o.id}`,
            type: 'order_placed',
            title: 'Order placed',
            description: o.title || `Order #${o.id.slice(0, 8)}`,
            timestamp: o.updated_at,
          });
        });

        mapped.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setEvents(mapped.slice(0, 10));
      } catch (err) {
        console.error('Activity feed error:', err);
        setError('Could not load activity');
      } finally {
        setIsLoading(false);
      }
    };

    fetchActivity();
    const interval = setInterval(fetchActivity, 60000);
    return () => clearInterval(interval);
  }, [orgId]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-gray-100 animate-pulse" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 bg-gray-100 rounded animate-pulse w-3/4" />
                  <div className="h-2.5 bg-gray-50 rounded animate-pulse w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <Ban className="h-8 w-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-400">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (events.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <Clock className="h-8 w-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-400">No recent activity</p>
            <p className="text-xs text-gray-300 mt-1">Invite your team and post jobs to get started</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const groups = groupEvents(events);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {groups.map((group) => (
            <div key={group.label}>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">{group.label}</p>
              <div className="space-y-2">
                {group.items.map((event) => (
                  <div key={event.id} className="flex items-start gap-3 py-1.5">
                    <div className="h-8 w-8 rounded-full bg-gray-50 flex items-center justify-center shrink-0">
                      {EVENT_ICONS[event.type] || <Clock className="h-4 w-4 text-gray-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{event.title}</p>
                      <p className="text-xs text-gray-500 truncate">{event.description}</p>
                    </div>
                    <span className="text-xs text-gray-400 whitespace-nowrap">{relativeTime(event.timestamp)}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

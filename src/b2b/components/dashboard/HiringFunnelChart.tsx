import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LabelList } from 'recharts';

interface FunnelStage {
  name: string;
  value: number;
  fill: string;
}

const STAGE_COLORS: Record<string, string> = {
  pending: '#f59e0b',
  reviewed: '#3b82f6',
  interviewed: '#8b5cf6',
  offer: '#f97316',
  accepted: '#22c55e',
};

interface Props {
  orgId: string;
}

export default function HiringFunnelChart({ orgId }: Props) {
  const [data, setData] = useState<FunnelStage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!orgId) return;

    const fetchFunnel = async () => {
      try {
        const { data: apps } = await (supabase as never as { from: (t: string) => any })
          .from('applications')
          .select('status, jobs!inner(org_id)')
          .eq('jobs.org_id', orgId);

        if (!apps || apps.length === 0) {
          setData([]);
          return;
        }

        const counts: Record<string, number> = {};
        apps.forEach((a: any) => {
          counts[a.status] = (counts[a.status] || 0) + 1;
        });

        const order = ['pending', 'reviewed', 'interviewed', 'offer', 'accepted'];
        const stages = order
          .filter((s) => counts[s] > 0)
          .map((s) => ({
            name: s.charAt(0).toUpperCase() + s.slice(1),
            value: counts[s] || 0,
            fill: STAGE_COLORS[s] || '#9ca3af',
          }));

        setData(stages);
      } catch (err) {
        console.error('Funnel fetch error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFunnel();
  }, [orgId]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader><CardTitle className="text-base">Hiring Funnel</CardTitle></CardHeader>
        <CardContent><div className="h-48 bg-gray-50 rounded-lg animate-pulse" /></CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader><CardTitle className="text-base">Hiring Funnel</CardTitle></CardHeader>
        <CardContent>
          <div className="h-48 flex items-center justify-center text-sm text-gray-400">
            Post a job to see your hiring funnel
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Hiring Funnel</CardTitle></CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data} layout="vertical" margin={{ left: 10, right: 40, top: 5, bottom: 5 }}>
            <XAxis type="number" hide />
            <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 12 }} />
            <Tooltip
              contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13 }}
              formatter={(val: number) => [val, 'Applicants']}
            />
            <Bar dataKey="value" radius={[0, 6, 6, 0]} maxBarSize={24}>
              <LabelList dataKey="value" position="right" style={{ fontSize: 12, fontWeight: 600, fill: '#374151' }} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

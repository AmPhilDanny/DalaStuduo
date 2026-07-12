import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { format, subDays } from 'date-fns';

interface Props {
  orgId: string;
}

interface DayCount {
  date: string;
  posts: number;
}

export default function JobTrendChart({ orgId }: Props) {
  const [data, setData] = useState<DayCount[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!orgId) return;

    const fetchTrend = async () => {
      try {
        const thirtyDaysAgo = subDays(new Date(), 30).toISOString();

        const { data: jobs } = await (supabase as never as { from: (t: string) => any })
          .from('jobs')
          .select('created_at')
          .eq('org_id', orgId)
          .gte('created_at', thirtyDaysAgo)
          .order('created_at', { ascending: true });

        if (!jobs || jobs.length === 0) {
          setData([]);
          return;
        }

        // Group by date
        const dayMap: Record<string, number> = {};
        for (let i = 29; i >= 0; i--) {
          const d = subDays(new Date(), i);
          dayMap[format(d, 'MMM dd')] = 0;
        }

        jobs.forEach((j: any) => {
          const key = format(new Date(j.created_at), 'MMM dd');
          if (dayMap[key] !== undefined) dayMap[key]++;
        });

        setData(Object.entries(dayMap).map(([date, posts]) => ({ date, posts })));
      } catch (err) {
        console.error('Trend fetch error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTrend();
  }, [orgId]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader><CardTitle className="text-base">Job Posting Trend</CardTitle></CardHeader>
        <CardContent><div className="h-48 bg-gray-50 rounded-lg animate-pulse" /></CardContent>
      </Card>
    );
  }

  if (data.length === 0 || data.every((d) => d.posts === 0)) {
    return (
      <Card>
        <CardHeader><CardTitle className="text-base">Job Posting Trend</CardTitle></CardHeader>
        <CardContent>
          <div className="h-48 flex items-center justify-center text-sm text-gray-400">
            No jobs posted in the last 30 days
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Job Posting Trend</CardTitle></CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={4} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
            <Tooltip
              contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13 }}
            />
            <Line
              type="monotone"
              dataKey="posts"
              stroke="#7c3aed"
              strokeWidth={2}
              dot={{ r: 3, fill: '#7c3aed' }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

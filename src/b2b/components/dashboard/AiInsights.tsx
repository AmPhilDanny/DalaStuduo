import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, Lightbulb, TrendingUp, Users, Target, Loader2, RefreshCw } from 'lucide-react';

interface Insight {
  icon: typeof Lightbulb;
  title: string;
  body: string;
  color: string;
}

interface Props {
  orgId: string;
  planSlug?: string | null;
}

const TEMPLATES: Insight[] = [
  { icon: TrendingUp, title: 'Post More Jobs', body: 'Organizations with 3+ active listings get 2x more applications. Consider opening more roles.', color: 'text-purple-600' },
  { icon: Users, title: 'Engage Your Team', body: 'Regularly invite team members to collaborate on hiring decisions for better outcomes.', color: 'text-blue-600' },
  { icon: Target, title: 'Review Applications', body: 'Fast review times improve candidate experience and your brand reputation.', color: 'text-green-600' },
  { icon: Lightbulb, title: 'Complete Your Profile', body: 'Organizations with complete profiles receive more qualified applicants.', color: 'text-amber-600' },
];

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export default function AiInsights({ orgId, planSlug }: Props) {
  const [insights, setInsights] = useState<Insight[]>(TEMPLATES);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState(false);

  const fetchInsights = useCallback(async () => {
    setIsFetching(true);
    setError(false);

    try {
      const { data, error: fnErr } = await supabase.functions.invoke('ai-assist', {
        body: {
          action: 'dashboard_insights',
          org_id: orgId,
          context: { is_premium: planSlug !== 'free' },
        },
      });

      if (fnErr || !data?.insights) {
        throw new Error(fnErr?.message || 'No insights returned');
      }

      const parsed: Insight[] = (data.insights as Array<{ title: string; body: string }>).slice(0, 4).map((i) => ({
        icon: Lightbulb,
        title: i.title || 'Insight',
        body: i.body || '',
        color: 'text-purple-600',
      }));

      if (parsed.length > 0) {
        setInsights(parsed);
      }
    } catch {
      setError(true);
      // keep current insights if fetch fails
    } finally {
      setIsFetching(false);
    }
  }, [orgId, planSlug]);

  // Rotate a random template every time
  useEffect(() => {
    setInsights(shuffleArray(TEMPLATES));
  }, [orgId]);

  const display = error || isFetching ? insights : insights;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-600" />
          <CardTitle className="text-base">AI Insights</CardTitle>
        </div>
        <Button variant="ghost" size="sm" onClick={fetchInsights} disabled={isFetching}>
          <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {isFetching && (
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            Generating insights...
          </div>
        )}
        {display.slice(0, 4).map((insight, i) => {
          const Icon = insight.icon;
          return (
            <div key={i} className="flex gap-3 p-3 rounded-lg bg-gray-50">
              <Icon className={`w-5 h-5 mt-0.5 shrink-0 ${insight.color}`} />
              <div>
                <p className="text-sm font-semibold text-gray-800">{insight.title}</p>
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{insight.body}</p>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

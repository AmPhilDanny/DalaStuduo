import type { ReactNode } from 'react';

interface StatCardProps {
  label: string;
  value: number | string;
  subtext?: string;
  icon: ReactNode;
  accentColor: string;
  trend?: { direction: 'up' | 'down'; percent: number };
  href?: string;
  onClick?: () => void;
}

const COLORS: Record<string, { bg: string; icon: string; text: string; ring: string }> = {
  purple: { bg: 'bg-purple-50', icon: 'text-purple-600', text: 'text-purple-700', ring: 'ring-purple-200' },
  blue: { bg: 'bg-blue-50', icon: 'text-blue-600', text: 'text-blue-700', ring: 'ring-blue-200' },
  green: { bg: 'bg-green-50', icon: 'text-green-600', text: 'text-green-700', ring: 'ring-green-200' },
  amber: { bg: 'bg-amber-50', icon: 'text-amber-600', text: 'text-amber-700', ring: 'ring-amber-200' },
  rose: { bg: 'bg-rose-50', icon: 'text-rose-600', text: 'text-rose-700', ring: 'ring-rose-200' },
  cyan: { bg: 'bg-cyan-50', icon: 'text-cyan-600', text: 'text-cyan-700', ring: 'ring-cyan-200' },
};

export default function StatCard({ label, value, subtext, icon, accentColor, trend, onClick }: StatCardProps) {
  const c = COLORS[accentColor] || COLORS.purple;

  return (
    <button
      onClick={onClick}
      className={`relative overflow-hidden rounded-xl border p-5 text-left w-full transition-all hover:shadow-md hover:-translate-y-0.5 ${c.bg} ${c.ring} ${onClick ? 'cursor-pointer' : 'cursor-default'}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`h-10 w-10 rounded-lg bg-white/80 flex items-center justify-center ${c.icon}`}>
          {icon}
        </div>
        {trend && (
          <span className={`inline-flex items-center gap-0.5 text-xs font-semibold px-1.5 py-0.5 rounded-full
            ${trend.direction === 'up' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d={trend.direction === 'up' ? 'M5 10l7-7m0 0l7 7m-7-7v18' : 'M19 14l-7 7m0 0l-7-7m7 7V3'} />
            </svg>
            {trend.percent}%
          </span>
        )}
      </div>
      <p className="text-3xl font-bold tracking-tight">{value}</p>
      <p className="text-sm font-medium mt-0.5 opacity-80">{label}</p>
      {subtext && <p className="text-xs mt-1 opacity-60">{subtext}</p>}
    </button>
  );
}

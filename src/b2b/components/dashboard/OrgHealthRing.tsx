interface OrgHealthRingProps {
  score: number; // 0–100
  label: string;
  sublabel?: string;
}

export default function OrgHealthRing({ score, label, sublabel }: OrgHealthRingProps) {
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const color = score >= 70 ? '#16a34a' : score >= 40 ? '#ca8a04' : '#dc2626';

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-20 h-20">
        <svg className="w-20 h-20 -rotate-90" viewBox="0 0 64 64">
          <circle cx="32" cy="32" r={radius} fill="none" stroke="#e5e7eb" strokeWidth="5" />
          <circle
            cx="32" cy="32" r={radius}
            fill="none"
            stroke={color}
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-700"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-bold" style={{ color }}>{score}%</span>
        </div>
      </div>
      <p className="text-xs font-medium text-gray-500 mt-1.5">{label}</p>
      {sublabel && <p className="text-[10px] text-gray-400">{sublabel}</p>}
    </div>
  );
}

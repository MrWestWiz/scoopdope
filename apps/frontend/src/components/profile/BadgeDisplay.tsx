'use client';

interface Badge {
  id: number;
  badge_type: string;
  minted_at: number;
  label?: string;
}

interface BadgeDisplayProps {
  badges?: Badge[];
  loading?: boolean;
  walletAddress?: string;
}

const BADGE_CONFIG: Record<string, { emoji: string; color: string; label: string }> = {
  complete:   { emoji: '🎓', color: 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/40', label: 'Course Complete' },
  honor_roll: { emoji: '⭐', color: 'from-amber-500/20 to-amber-600/10 border-amber-500/40',     label: 'Honor Roll'     },
  attendance: { emoji: '📅', color: 'from-sky-500/20 to-sky-600/10 border-sky-500/40',           label: 'Full Attendance' },
  first:      { emoji: '🥇', color: 'from-yellow-500/20 to-yellow-600/10 border-yellow-500/40',  label: 'First Steps'    },
  default:    { emoji: '🏅', color: 'from-purple-500/20 to-purple-600/10 border-purple-500/40',  label: 'Achievement'    },
};

function BadgeCard({ badge }: { badge: Badge }) {
  const key    = badge.badge_type.toLowerCase();
  const config = BADGE_CONFIG[key] ?? BADGE_CONFIG.default;
  const date   = new Date(badge.minted_at * 1000).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });

  return (
    <div className={`flex flex-col items-center gap-2 rounded-2xl bg-gradient-to-br ${config.color} border p-4 text-center min-w-[100px] transition-transform hover:scale-105`}>
      <span className="text-3xl" role="img" aria-label={config.label}>{config.emoji}</span>
      <p className="text-xs font-semibold text-white leading-tight">{config.label}</p>
      <p className="text-[10px] text-white/40">{date}</p>
      <p className="text-[10px] text-white/30 font-mono">#{badge.id}</p>
    </div>
  );
}

export default function BadgeDisplay({ badges, loading, walletAddress }: BadgeDisplayProps) {
  if (!walletAddress) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
        <p className="text-sm text-white/40">Connect your wallet to view achievement badges</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <div className="flex gap-3 overflow-x-auto pb-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="min-w-[100px] h-[140px] rounded-2xl bg-white/10 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!badges || badges.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
        <span className="text-3xl">🏆</span>
        <p className="mt-2 text-sm text-white/40">No badges yet — complete courses to earn achievements</p>
      </div>
    );
  }

  return (
    <section aria-label="Achievement Badges">
      <h3 className="text-sm font-semibold text-white/70 mb-3">
        Achievement Badges <span className="ml-1 text-white/40">({badges.length})</span>
      </h3>
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-white/10">
        {badges.map((badge) => <BadgeCard key={badge.id} badge={badge} />)}
      </div>
    </section>
  );
}

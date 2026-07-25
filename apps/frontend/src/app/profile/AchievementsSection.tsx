'use client';

import React from 'react';
import type { BadgeState } from './types';

function BadgeCard({ b }: { b: BadgeState }) {
  return (
    <div className={`p-4 border rounded-lg ${b.earned ? 'bg-white' : 'bg-gray-50 filter grayscale'}`}>
      <div className="font-semibold">{b.name}</div>
      <div className="text-sm text-gray-600">{b.earned ? b.description : 'Locked'}</div>
    </div>
  );
}

export default function AchievementsSection({ badges }: { badges: BadgeState[] }) {
  return (
    <section>
      <h2 className="text-lg font-semibold mb-3">Achievements</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {badges.map((b) => (
          <BadgeCard key={b.id} b={b} />
        ))}
      </div>
    </section>
  );
}

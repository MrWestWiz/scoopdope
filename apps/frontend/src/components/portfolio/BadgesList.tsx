'use client';

import Image from 'next/image';
import { Star } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import type { PortfolioBadge } from '@/lib/portfolioApi';

interface BadgesListProps {
  badges: PortfolioBadge[];
}

export function BadgesList({ badges }: BadgesListProps) {
  if (badges.length === 0) {
    return (
      <div className="text-center py-10 text-gray-500 dark:text-gray-400">
        No badges earned yet.
      </div>
    );
  }

  return (
    <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4" aria-label="Badges">
      {badges.map((badge) => (
        <li key={badge.id}>
          <Card className="flex flex-col items-center gap-2 p-4 text-center h-full">
            <div className="w-14 h-14 rounded-full overflow-hidden bg-yellow-50 dark:bg-yellow-900/30 flex items-center justify-center">
              {badge.iconUrl ? (
                <Image
                  src={badge.iconUrl}
                  alt={badge.name}
                  width={56}
                  height={56}
                  className="object-contain"
                />
              ) : (
                <Star className="w-7 h-7 text-yellow-500" aria-hidden="true" />
              )}
            </div>
            <p className="font-semibold text-sm text-gray-900 dark:text-white">{badge.name}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{badge.description}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-auto">
              <time dateTime={badge.awardedAt}>
                {new Date(badge.awardedAt).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'short',
                })}
              </time>
            </p>
          </Card>
        </li>
      ))}
    </ul>
  );
}

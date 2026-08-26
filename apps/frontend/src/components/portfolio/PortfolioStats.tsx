'use client';

import { BookOpen, Clock, Award, Star } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import type { PortfolioStats } from '@/lib/portfolioApi';

interface PortfolioStatsProps {
  stats: PortfolioStats;
}

export function PortfolioStats({ stats }: PortfolioStatsProps) {
  const items = [
    {
      icon: BookOpen,
      label: 'Courses Completed',
      value: stats.totalCourses,
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-50 dark:bg-blue-900/30',
    },
    {
      icon: Clock,
      label: 'Learning Hours',
      value: stats.totalHours,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-900/30',
    },
    {
      icon: Award,
      label: 'Certificates Earned',
      value: stats.totalCertificates,
      color: 'text-purple-600 dark:text-purple-400',
      bg: 'bg-purple-50 dark:bg-purple-900/30',
    },
    {
      icon: Star,
      label: 'Badges Earned',
      value: stats.totalBadges,
      color: 'text-yellow-600 dark:text-yellow-400',
      bg: 'bg-yellow-50 dark:bg-yellow-900/30',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {items.map(({ icon: Icon, label, value, color, bg }) => (
        <Card key={label} className="flex flex-col items-center py-5 px-3 gap-2">
          <div className={`p-2 rounded-full ${bg}`}>
            <Icon className={`w-5 h-5 ${color}`} aria-hidden="true" />
          </div>
          <span className="text-2xl font-bold text-gray-900 dark:text-white">{value}</span>
          <span className="text-xs text-center text-gray-500 dark:text-gray-400">{label}</span>
        </Card>
      ))}
    </div>
  );
}

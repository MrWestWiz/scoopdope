'use client';

import { useEffect, useState } from 'react';
import { Globe } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { PortfolioStats } from './PortfolioStats';
import { CompletedCoursesList } from './CompletedCoursesList';
import { CertificatesList } from './CertificatesList';
import { BadgesList } from './BadgesList';
import { fetchPublicPortfolio, type Portfolio } from '@/lib/portfolioApi';

type Tab = 'courses' | 'certificates' | 'badges';

interface PublicPortfolioViewProps {
  slug: string;
}

export function PublicPortfolioView({ slug }: PublicPortfolioViewProps) {
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetchPublicPortfolio(slug)
      .then(setPortfolio)
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  const [activeTab, setActiveTab] = useState<Tab>('courses');

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24" aria-busy="true">
        <Spinner size="lg" />
      </div>
    );
  }

  if (notFound || !portfolio) {
    return (
      <div className="text-center py-24 space-y-2" role="alert">
        <p className="text-2xl font-bold text-gray-900 dark:text-white">Portfolio not found</p>
        <p className="text-gray-500 dark:text-gray-400">
          This portfolio is private or does not exist.
        </p>
      </div>
    );
  }

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: 'courses', label: 'Courses', count: portfolio.stats.totalCourses },
    { id: 'certificates', label: 'Certificates', count: portfolio.stats.totalCertificates },
    { id: 'badges', label: 'Badges', count: portfolio.stats.totalBadges },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <Card className="space-y-2">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-emerald-500" aria-hidden="true" />
          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Public Portfolio</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {portfolio.displayName || 'Student Portfolio'}
        </h1>
        {portfolio.bio && (
          <p className="text-gray-600 dark:text-gray-400 text-sm whitespace-pre-line">{portfolio.bio}</p>
        )}
      </Card>

      {/* Stats */}
      <PortfolioStats stats={portfolio.stats} />

      {/* Tabs */}
      <div className="space-y-4">
        <div
          role="tablist"
          aria-label="Portfolio sections"
          className="flex gap-1 border-b border-gray-200 dark:border-gray-700"
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls={`tabpanel-${tab.id}`}
              id={`tab-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-t
                ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
            >
              {tab.label}
              <span className="ml-1.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-1.5 py-0.5 rounded-full">
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        <div
          role="tabpanel"
          id={`tabpanel-${activeTab}`}
          aria-labelledby={`tab-${activeTab}`}
        >
          {activeTab === 'courses' && <CompletedCoursesList courses={portfolio.completedCourses} />}
          {activeTab === 'certificates' && <CertificatesList certificates={portfolio.certificates} />}
          {activeTab === 'badges' && <BadgesList badges={portfolio.badges} />}
        </div>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState, useCallback } from 'react';
import { Globe, Lock, Share2, Edit2, Check, X } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { PortfolioStats } from './PortfolioStats';
import { CompletedCoursesList } from './CompletedCoursesList';
import { CertificatesList } from './CertificatesList';
import { BadgesList } from './BadgesList';
import { SharePortfolioModal } from './SharePortfolioModal';
import { toast } from '@/lib/toast';
import {
  fetchMyPortfolio,
  updateMyPortfolio,
  type Portfolio,
} from '@/lib/portfolioApi';

type Tab = 'courses' | 'certificates' | 'badges';

export function PortfolioPage() {
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('courses');
  const [shareOpen, setShareOpen] = useState(false);

  // Inline edit state
  const [editing, setEditing] = useState(false);
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchMyPortfolio();
      setPortfolio(data);
    } catch {
      setError('Failed to load portfolio. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleTogglePublic = useCallback(async () => {
    if (!portfolio) return;
    const next = !portfolio.isPublic;
    try {
      const updated = await updateMyPortfolio({ isPublic: next });
      setPortfolio(updated);
      toast.success(next ? 'Portfolio is now public' : 'Portfolio is now private');
    } catch {
      toast.error('Failed to update visibility');
    }
  }, [portfolio]);

  const startEditing = useCallback(() => {
    if (!portfolio) return;
    setEditDisplayName(portfolio.displayName ?? '');
    setEditBio(portfolio.bio ?? '');
    setEditing(true);
  }, [portfolio]);

  const cancelEditing = useCallback(() => {
    setEditing(false);
  }, []);

  const saveEditing = useCallback(async () => {
    setSaving(true);
    try {
      const updated = await updateMyPortfolio({
        displayName: editDisplayName.trim() || undefined,
        bio: editBio.trim() || undefined,
      });
      setPortfolio(updated);
      setEditing(false);
      toast.success('Portfolio updated');
    } catch {
      toast.error('Failed to save changes');
    } finally {
      setSaving(false);
    }
  }, [editDisplayName, editBio]);

  const handleSlugRegenerated = useCallback((newSlug: string) => {
    setPortfolio((prev) => (prev ? { ...prev, publicSlug: newSlug } : prev));
  }, []);

  const tabs: { id: Tab; label: string; count: number }[] = portfolio
    ? [
        { id: 'courses', label: 'Courses', count: portfolio.stats.totalCourses },
        { id: 'certificates', label: 'Certificates', count: portfolio.stats.totalCertificates },
        { id: 'badges', label: 'Badges', count: portfolio.stats.totalBadges },
      ]
    : [];

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24" aria-live="polite" aria-busy="true">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !portfolio) {
    return (
      <div className="text-center py-16 text-red-500 dark:text-red-400" role="alert">
        {error ?? 'Portfolio unavailable.'}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* ── Header card ───────────────────────────────────────────────────── */}
      <Card className="space-y-4">
        {/* Display name + actions */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          {editing ? (
            <div className="flex-1 space-y-2">
              <input
                autoFocus
                aria-label="Display name"
                value={editDisplayName}
                onChange={(e) => setEditDisplayName(e.target.value)}
                maxLength={255}
                placeholder="Display name (optional)"
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-transparent px-3 py-2 text-lg font-bold text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
              />
              <textarea
                aria-label="Portfolio bio"
                value={editBio}
                onChange={(e) => setEditBio(e.target.value)}
                maxLength={2000}
                rows={3}
                placeholder="Bio (optional)"
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-transparent px-3 py-2 text-sm text-gray-700 dark:text-gray-300 outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={saveEditing} disabled={saving}>
                  {saving ? 'Saving…' : <><Check className="w-4 h-4 mr-1" />Save</>}
                </Button>
                <Button size="sm" variant="secondary" onClick={cancelEditing}>
                  <X className="w-4 h-4 mr-1" />Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white truncate">
                {portfolio.displayName || 'My Portfolio'}
              </h1>
              {portfolio.bio && (
                <p className="mt-1 text-gray-600 dark:text-gray-400 text-sm whitespace-pre-line">
                  {portfolio.bio}
                </p>
              )}
            </div>
          )}

          {!editing && (
            <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
              {/* Visibility toggle */}
              <button
                onClick={handleTogglePublic}
                aria-label={portfolio.isPublic ? 'Make portfolio private' : 'Make portfolio public'}
                className="inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-full border transition-colors
                  border-gray-300 dark:border-gray-600
                  hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                {portfolio.isPublic ? (
                  <>
                    <Globe className="w-4 h-4 text-emerald-500" aria-hidden="true" />
                    <span className="text-emerald-600 dark:text-emerald-400">Public</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4 text-gray-400" aria-hidden="true" />
                    <span className="text-gray-500 dark:text-gray-400">Private</span>
                  </>
                )}
              </button>

              {/* Share */}
              {portfolio.isPublic && (
                <Button size="sm" variant="secondary" onClick={() => setShareOpen(true)}>
                  <Share2 className="w-4 h-4 mr-1" aria-hidden="true" />
                  Share
                </Button>
              )}

              {/* Edit */}
              <Button size="sm" variant="secondary" onClick={startEditing}>
                <Edit2 className="w-4 h-4 mr-1" aria-hidden="true" />
                Edit
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* ── Stats row ─────────────────────────────────────────────────────── */}
      <PortfolioStats stats={portfolio.stats} />

      {/* ── Tabbed content ────────────────────────────────────────────────── */}
      <div className="space-y-4">
        {/* Tab bar */}
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

        {/* Tab panels */}
        <div
          role="tabpanel"
          id={`tabpanel-${activeTab}`}
          aria-labelledby={`tab-${activeTab}`}
        >
          {activeTab === 'courses' && (
            <CompletedCoursesList courses={portfolio.completedCourses} />
          )}
          {activeTab === 'certificates' && (
            <CertificatesList certificates={portfolio.certificates} />
          )}
          {activeTab === 'badges' && (
            <BadgesList badges={portfolio.badges} />
          )}
        </div>
      </div>

      {/* Share modal */}
      <SharePortfolioModal
        publicSlug={portfolio.publicSlug}
        isOpen={shareOpen}
        onClose={() => setShareOpen(false)}
        onSlugRegenerated={handleSlugRegenerated}
      />
    </div>
  );
}

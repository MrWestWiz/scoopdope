'use client';

import { useState, useCallback } from 'react';
import { Copy, Check, RefreshCw, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { toast } from '@/lib/toast';
import { regeneratePortfolioSlug } from '@/lib/portfolioApi';

interface SharePortfolioModalProps {
  publicSlug: string;
  isOpen: boolean;
  onClose: () => void;
  onSlugRegenerated: (newSlug: string) => void;
}

export function SharePortfolioModal({
  publicSlug,
  isOpen,
  onClose,
  onSlugRegenerated,
}: SharePortfolioModalProps) {
  const [copied, setCopied] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  const portfolioUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/portfolio/${publicSlug}`
      : `/portfolio/${publicSlug}`;

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(portfolioUrl);
      setCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy link');
    }
  }, [portfolioUrl]);

  const handleRegenerate = useCallback(async () => {
    if (!confirm('This will invalidate your current shareable link. Continue?')) return;
    setRegenerating(true);
    try {
      const { publicSlug: newSlug } = await regeneratePortfolioSlug();
      onSlugRegenerated(newSlug);
      toast.success('New link generated');
    } catch {
      toast.error('Failed to regenerate link');
    } finally {
      setRegenerating(false);
    }
  }, [onSlugRegenerated]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md p-6 flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2
            id="share-modal-title"
            className="text-lg font-semibold text-gray-900 dark:text-white"
          >
            Share Portfolio
          </h2>
          <button
            onClick={onClose}
            aria-label="Close share dialog"
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* QR Code — rendered via a free public API; no extra dependency needed */}
        <div className="flex justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(portfolioUrl)}`}
            alt="Portfolio QR code"
            width={160}
            height={160}
            className="rounded-lg border border-gray-200 dark:border-gray-600"
          />
        </div>

        {/* Shareable URL */}
        <div className="flex items-center gap-2">
          <input
            readOnly
            value={portfolioUrl}
            aria-label="Shareable portfolio URL"
            className="flex-1 rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 outline-none"
          />
          <button
            onClick={handleCopy}
            aria-label="Copy link"
            className="p-2 rounded-md border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            {copied ? (
              <Check className="w-4 h-4 text-emerald-500" />
            ) : (
              <Copy className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            )}
          </button>
        </div>

        {/* Regenerate link */}
        <button
          onClick={handleRegenerate}
          disabled={regenerating}
          className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 disabled:opacity-50 self-start"
        >
          <RefreshCw className={`w-4 h-4 ${regenerating ? 'animate-spin' : ''}`} />
          {regenerating ? 'Generating…' : 'Invalidate & regenerate link'}
        </button>

        <Button onClick={onClose} className="w-full">
          Done
        </Button>
      </div>
    </div>
  );
}

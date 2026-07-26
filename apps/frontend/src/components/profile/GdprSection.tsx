'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import api from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Spinner } from '@/components/ui/Spinner';

interface GdprSectionProps {
  userId: string;
}

export function GdprSection({ userId }: GdprSectionProps) {
  const t = useTranslations('gdpr');
  const [exporting, setExporting] = useState(false);
  const [exportDone, setExportDone] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteDone, setDeleteDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmText, setConfirmText] = useState('');

  const handleExport = async () => {
    setExporting(true);
    setError(null);
    setExportDone(false);
    try {
      const response = await api.post('/users/me/export');
      const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `personal-data-${userId.slice(0, 8)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setExportDone(true);
    } catch {
      setError(t('exportError'));
    } finally {
      setExporting(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    setError(null);
    try {
      await api.delete('/users/me/account');
      setDeleteDone(true);
      setTimeout(() => {
        window.location.href = '/';
      }, 3000);
    } catch {
      setError(t('deleteError'));
      setDeleting(false);
    }
  };

  const handleCloseDelete = () => {
    if (!deleting) {
      setDeleteOpen(false);
      setConfirmText('');
    }
  };

  return (
    <section aria-labelledby="gdpr-heading" className="space-y-6">
      <h2 id="gdpr-heading" className="text-lg font-semibold text-gray-900 dark:text-white">
        {t('title')}
      </h2>
      <p className="text-sm text-gray-600 dark:text-gray-400">{t('description')}</p>

      {error && (
        <div
          role="alert"
          className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-300"
        >
          {error}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4">
        <Button
          variant="outline"
          onClick={handleExport}
          disabled={exporting}
          aria-busy={exporting}
        >
          {exporting ? <><Spinner size="sm" className="mr-2" /> {t('exporting')}</> : exportDone ? t('exported') : t('exportData')}
        </Button>

        <Button
          variant="outline"
          onClick={() => setDeleteOpen(true)}
          className="border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
        >
          {t('deleteAccount')}
        </Button>
      </div>

      <Modal isOpen={deleteOpen} onClose={handleCloseDelete} title={t('confirmTitle')}>
        {deleteDone ? (
          <div className="text-center space-y-4">
            <p className="text-gray-700 dark:text-gray-300">{t('deleteSuccess')}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{t('redirecting')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-gray-700 dark:text-gray-300">{t('confirmDescription')}</p>
            <div>
              <label htmlFor="confirm-delete" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('typeConfirm', { phrase: 'DELETE' })}
              </label>
              <input
                id="confirm-delete"
                type="text"
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="DELETE"
                disabled={deleting}
              />
            </div>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={handleCloseDelete} disabled={deleting}>
                {t('cancel')}
              </Button>
              <Button
                variant="outline"
                onClick={handleDelete}
                disabled={confirmText !== 'DELETE' || deleting}
                className="border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                {deleting ? t('deleting') : t('confirmDelete')}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </section>
  );
}

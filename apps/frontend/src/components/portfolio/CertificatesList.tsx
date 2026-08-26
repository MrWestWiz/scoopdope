'use client';

import Link from 'next/link';
import { Award, ExternalLink, Download } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import type { PortfolioCertificate } from '@/lib/portfolioApi';

interface CertificatesListProps {
  certificates: PortfolioCertificate[];
}

export function CertificatesList({ certificates }: CertificatesListProps) {
  if (certificates.length === 0) {
    return (
      <div className="text-center py-10 text-gray-500 dark:text-gray-400">
        No certificates earned yet.
      </div>
    );
  }

  return (
    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4" aria-label="Certificates">
      {certificates.map((cert) => (
        <li key={cert.certificateId}>
          <Card className="flex flex-col gap-3 p-4 h-full">
            {/* Icon + title */}
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 p-2 bg-purple-50 dark:bg-purple-900/30 rounded-full">
                <Award className="w-5 h-5 text-purple-600 dark:text-purple-400" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-gray-900 dark:text-white text-sm line-clamp-2">
                  {cert.courseTitle}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Issued{' '}
                  <time dateTime={cert.issuedAt}>
                    {new Date(cert.issuedAt).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </time>
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 mt-auto flex-wrap">
              <Link
                href={`/certificates/${cert.certificateId}`}
                className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline"
              >
                <ExternalLink className="w-3 h-3" aria-hidden="true" />
                View
              </Link>

              {cert.pdfUrl && (
                <a
                  href={cert.pdfUrl}
                  download
                  className="inline-flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400 hover:underline"
                >
                  <Download className="w-3 h-3" aria-hidden="true" />
                  PDF
                </a>
              )}

              {cert.stellarTransactionId && (
                <a
                  href={`https://horizon-testnet.stellar.org/transactions/${cert.stellarTransactionId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 hover:underline"
                >
                  <ExternalLink className="w-3 h-3" aria-hidden="true" />
                  On-chain
                </a>
              )}
            </div>
          </Card>
        </li>
      ))}
    </ul>
  );
}

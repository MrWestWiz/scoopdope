import type { Metadata } from 'next';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { PortfolioPage } from '@/components/portfolio/PortfolioPage';

export const metadata: Metadata = {
  title: 'My Portfolio',
  description: 'View and manage your learning portfolio, completed courses, certificates, and badges.',
};

export default function MyPortfolioPage() {
  return (
    <ProtectedRoute>
      <PortfolioPage />
    </ProtectedRoute>
  );
}

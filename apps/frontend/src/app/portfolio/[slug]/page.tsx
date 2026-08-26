import type { Metadata } from 'next';
import { PublicPortfolioView } from '@/components/portfolio/PublicPortfolioView';

interface Props {
  params: { slug: string };
}

export const metadata: Metadata = {
  title: 'Student Portfolio',
  description: 'Public learning portfolio on scoopdope.',
};

export default function PublicPortfolioPage({ params }: Props) {
  return <PublicPortfolioView slug={params.slug} />;
}

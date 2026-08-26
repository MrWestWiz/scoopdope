import api from './api';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface PortfolioCourse {
  courseId: string;
  title: string;
  description: string;
  thumbnailUrl: string | null;
  level: string;
  durationHours: number;
  completedAt: string;
}

export interface PortfolioCertificate {
  certificateId: string;
  courseId: string;
  courseTitle: string;
  certificateHash: string;
  stellarTransactionId: string | null;
  pdfUrl: string | null;
  issuedAt: string;
}

export interface PortfolioBadge {
  id: string;
  name: string;
  description: string;
  iconUrl: string;
  awardedAt: string;
}

export interface PortfolioStats {
  totalCourses: number;
  totalHours: number;
  totalCertificates: number;
  totalBadges: number;
}

export interface Portfolio {
  id: string;
  userId: string;
  publicSlug: string;
  isPublic: boolean;
  displayName: string | null;
  bio: string | null;
  createdAt: string;
  updatedAt: string;
  stats: PortfolioStats;
  completedCourses: PortfolioCourse[];
  certificates: PortfolioCertificate[];
  badges: PortfolioBadge[];
}

export interface UpdatePortfolioPayload {
  displayName?: string;
  bio?: string;
  isPublic?: boolean;
}

// ── API calls ──────────────────────────────────────────────────────────────────

/** Fetch the authenticated user's portfolio (creates one if absent). */
export async function fetchMyPortfolio(): Promise<Portfolio> {
  const { data } = await api.get<Portfolio>('/v1/portfolio/me');
  return data;
}

/** Update the authenticated user's portfolio settings. */
export async function updateMyPortfolio(payload: UpdatePortfolioPayload): Promise<Portfolio> {
  const { data } = await api.patch<Portfolio>('/v1/portfolio/me', payload);
  return data;
}

/** Regenerate the shareable URL slug. */
export async function regeneratePortfolioSlug(): Promise<{ publicSlug: string }> {
  const { data } = await api.post<{ publicSlug: string }>('/v1/portfolio/me/regenerate-slug');
  return data;
}

/** Fetch a public portfolio by its slug (no auth required). */
export async function fetchPublicPortfolio(slug: string): Promise<Portfolio> {
  const { data } = await api.get<Portfolio>(`/v1/portfolio/public/${slug}`);
  return data;
}

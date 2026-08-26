import { ForbiddenException } from '@nestjs/common';
import { PortfolioController } from './portfolio.controller';

// ── Helpers ────────────────────────────────────────────────────────────────────

const mockPortfolio = {
  id: 'pf-1',
  userId: 'user-1',
  publicSlug: 'abc123',
  isPublic: true,
  displayName: null,
  bio: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  stats: { totalCourses: 2, totalHours: 10, totalCertificates: 1, totalBadges: 0 },
  completedCourses: [],
  certificates: [],
  badges: [],
};

function makeService() {
  return {
    getMyPortfolio: jest.fn().mockResolvedValue(mockPortfolio),
    updatePortfolio: jest.fn().mockResolvedValue(mockPortfolio),
    regenerateSlug: jest.fn().mockResolvedValue({ publicSlug: 'newslug' }),
    getPublicPortfolio: jest.fn().mockResolvedValue(mockPortfolio),
  };
}

function makeReq(id = 'user-1', role = 'student') {
  return { user: { id, role } };
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('PortfolioController', () => {
  let controller: PortfolioController;
  let service: ReturnType<typeof makeService>;

  beforeEach(() => {
    jest.clearAllMocks();
    service = makeService();
    controller = new PortfolioController(service as any);
  });

  // ── GET /me ─────────────────────────────────────────────────────────────────

  describe('getMyPortfolio', () => {
    it('delegates to service.getMyPortfolio with the user id from JWT', async () => {
      const req = makeReq('user-1');
      await controller.getMyPortfolio(req);
      expect(service.getMyPortfolio).toHaveBeenCalledWith('user-1');
    });

    it('returns the portfolio response from the service', async () => {
      const result = await controller.getMyPortfolio(makeReq());
      expect(result).toEqual(mockPortfolio);
    });
  });

  // ── PATCH /me ───────────────────────────────────────────────────────────────

  describe('updateMyPortfolio', () => {
    it('delegates to service.updatePortfolio with correct args', async () => {
      const dto = { isPublic: true };
      await controller.updateMyPortfolio(makeReq('user-1'), dto);
      expect(service.updatePortfolio).toHaveBeenCalledWith('user-1', dto);
    });
  });

  // ── POST /me/regenerate-slug ────────────────────────────────────────────────

  describe('regenerateSlug', () => {
    it('returns the new slug from the service', async () => {
      const result = await controller.regenerateSlug(makeReq('user-1'));
      expect(result).toEqual({ publicSlug: 'newslug' });
      expect(service.regenerateSlug).toHaveBeenCalledWith('user-1');
    });
  });

  // ── GET /user/:userId ───────────────────────────────────────────────────────

  describe('getUserPortfolio', () => {
    it('allows a user to view their own portfolio', async () => {
      await expect(
        controller.getUserPortfolio('user-1', makeReq('user-1', 'student')),
      ).resolves.toEqual(mockPortfolio);
    });

    it('allows an admin to view any portfolio', async () => {
      await expect(
        controller.getUserPortfolio('user-2', makeReq('admin-id', 'admin')),
      ).resolves.toEqual(mockPortfolio);
    });

    it('throws ForbiddenException when a non-admin requests another user portfolio', async () => {
      await expect(
        controller.getUserPortfolio('user-2', makeReq('user-1', 'student')),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  // ── GET /public/:slug ───────────────────────────────────────────────────────

  describe('getPublicPortfolio', () => {
    it('delegates to service.getPublicPortfolio with the slug', async () => {
      await controller.getPublicPortfolio('abc123');
      expect(service.getPublicPortfolio).toHaveBeenCalledWith('abc123');
    });

    it('returns the portfolio from the service', async () => {
      const result = await controller.getPublicPortfolio('abc123');
      expect(result).toEqual(mockPortfolio);
    });
  });
});

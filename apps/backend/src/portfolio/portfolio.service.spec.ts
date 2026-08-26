import { NotFoundException } from '@nestjs/common';
import { PortfolioService } from './portfolio.service';

// ── Helpers ────────────────────────────────────────────────────────────────────

function makePortfolioRepo(overrides: Partial<ReturnType<typeof makePortfolioRepo>> = {}) {
  return {
    findOne: jest.fn(),
    create: jest.fn((data: any) => ({ ...data })),
    save: jest.fn(async (e: any) => ({ ...e, createdAt: new Date(), updatedAt: new Date() })),
    ...overrides,
  };
}

function makeEnrollmentRepo() {
  return {
    find: jest.fn(),
  };
}

function makeCertificateRepo() {
  return {
    find: jest.fn(),
  };
}

function makeService(
  portfolioRepo = makePortfolioRepo(),
  enrollmentRepo = makeEnrollmentRepo(),
  certificateRepo = makeCertificateRepo(),
) {
  return new PortfolioService(
    portfolioRepo as any,
    enrollmentRepo as any,
    certificateRepo as any,
  );
}

// ── Fixtures ───────────────────────────────────────────────────────────────────

const portfolio = {
  id: 'pf-1',
  userId: 'user-1',
  publicSlug: 'abc123',
  isPublic: false,
  displayName: null,
  bio: null,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
};

const completedEnrollment = {
  userId: 'user-1',
  courseId: 'course-1',
  completedAt: new Date('2026-03-01'),
  course: {
    title: 'Blockchain 101',
    description: 'Intro to blockchain',
    thumbnailUrl: null,
    level: 'beginner',
    durationHours: 5,
  },
};

const certificate = {
  id: 'cert-1',
  userId: 'user-1',
  courseId: 'course-1',
  certificateHash: 'hash123',
  stellarTransactionId: 'tx-abc',
  pdfUrl: null,
  status: 'minted',
  revokedAt: null,
  issuedAt: new Date('2026-03-02'),
  course: { title: 'Blockchain 101' },
};

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('PortfolioService', () => {
  beforeEach(() => jest.clearAllMocks());

  // ── getOrCreate ─────────────────────────────────────────────────────────────

  describe('getOrCreate', () => {
    it('returns existing portfolio when found', async () => {
      const repo = makePortfolioRepo({ findOne: jest.fn().mockResolvedValue(portfolio) });
      const service = makeService(repo);

      const result = await service.getOrCreate('user-1');

      expect(result).toEqual(portfolio);
      expect(repo.save).not.toHaveBeenCalled();
    });

    it('creates and saves a new portfolio when not found', async () => {
      const repo = makePortfolioRepo({ findOne: jest.fn().mockResolvedValue(null) });
      const service = makeService(repo);

      await service.getOrCreate('user-1');

      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'user-1', isPublic: false }),
      );
      expect(repo.save).toHaveBeenCalledTimes(1);
    });

    it('generates a 24-char hex slug for new portfolios', async () => {
      let savedSlug = '';
      const repo = makePortfolioRepo({
        findOne: jest.fn().mockResolvedValue(null),
        create: jest.fn((data: any) => data),
        save: jest.fn(async (e: any) => {
          savedSlug = e.publicSlug;
          return { ...e, createdAt: new Date(), updatedAt: new Date() };
        }),
      });
      const service = makeService(repo);

      await service.getOrCreate('user-1');

      expect(savedSlug).toMatch(/^[0-9a-f]{24}$/);
    });
  });

  // ── getMyPortfolio ──────────────────────────────────────────────────────────

  describe('getMyPortfolio', () => {
    it('returns a full portfolio response with stats', async () => {
      const pRepo = makePortfolioRepo({ findOne: jest.fn().mockResolvedValue(portfolio) });
      const eRepo = makeEnrollmentRepo();
      const cRepo = makeCertificateRepo();

      eRepo.find = jest.fn().mockResolvedValue([completedEnrollment]);
      cRepo.find = jest.fn().mockResolvedValue([certificate]);

      const service = makeService(pRepo, eRepo, cRepo);
      const result = await service.getMyPortfolio('user-1');

      expect(result.stats.totalCourses).toBe(1);
      expect(result.stats.totalHours).toBe(5);
      expect(result.stats.totalCertificates).toBe(1);
      expect(result.completedCourses).toHaveLength(1);
      expect(result.completedCourses[0].title).toBe('Blockchain 101');
      expect(result.certificates).toHaveLength(1);
      expect(result.certificates[0].certificateId).toBe('cert-1');
    });

    it('excludes pending certificates from the response', async () => {
      const pendingCert = { ...certificate, status: 'pending' };
      const pRepo = makePortfolioRepo({ findOne: jest.fn().mockResolvedValue(portfolio) });
      const eRepo = makeEnrollmentRepo();
      const cRepo = makeCertificateRepo();

      eRepo.find = jest.fn().mockResolvedValue([]);
      cRepo.find = jest.fn().mockResolvedValue([pendingCert]);

      const service = makeService(pRepo, eRepo, cRepo);
      const result = await service.getMyPortfolio('user-1');

      expect(result.certificates).toHaveLength(0);
    });

    it('excludes revoked certificates from the response', async () => {
      const revokedCert = { ...certificate, revokedAt: new Date() };
      const pRepo = makePortfolioRepo({ findOne: jest.fn().mockResolvedValue(portfolio) });
      const eRepo = makeEnrollmentRepo();
      const cRepo = makeCertificateRepo();

      eRepo.find = jest.fn().mockResolvedValue([]);
      cRepo.find = jest.fn().mockResolvedValue([revokedCert]);

      const service = makeService(pRepo, eRepo, cRepo);
      const result = await service.getMyPortfolio('user-1');

      expect(result.certificates).toHaveLength(0);
    });

    it('returns zero stats when user has no activity', async () => {
      const pRepo = makePortfolioRepo({ findOne: jest.fn().mockResolvedValue(portfolio) });
      const eRepo = makeEnrollmentRepo();
      const cRepo = makeCertificateRepo();

      eRepo.find = jest.fn().mockResolvedValue([]);
      cRepo.find = jest.fn().mockResolvedValue([]);

      const service = makeService(pRepo, eRepo, cRepo);
      const result = await service.getMyPortfolio('user-1');

      expect(result.stats).toEqual({
        totalCourses: 0,
        totalHours: 0,
        totalCertificates: 0,
        totalBadges: 0,
      });
    });
  });

  // ── getPublicPortfolio ──────────────────────────────────────────────────────

  describe('getPublicPortfolio', () => {
    it('returns the portfolio for a public slug', async () => {
      const publicPortfolio = { ...portfolio, isPublic: true };
      const pRepo = makePortfolioRepo({ findOne: jest.fn().mockResolvedValue(publicPortfolio) });
      const eRepo = makeEnrollmentRepo();
      const cRepo = makeCertificateRepo();

      eRepo.find = jest.fn().mockResolvedValue([]);
      cRepo.find = jest.fn().mockResolvedValue([]);

      const service = makeService(pRepo, eRepo, cRepo);
      const result = await service.getPublicPortfolio('abc123');

      expect(result.isPublic).toBe(true);
      expect(result.publicSlug).toBe('abc123');
    });

    it('throws NotFoundException for unknown or private slug', async () => {
      const pRepo = makePortfolioRepo({ findOne: jest.fn().mockResolvedValue(null) });
      const service = makeService(pRepo);

      await expect(service.getPublicPortfolio('unknown')).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  // ── updatePortfolio ─────────────────────────────────────────────────────────

  describe('updatePortfolio', () => {
    it('updates isPublic to true', async () => {
      const pRepo = makePortfolioRepo({ findOne: jest.fn().mockResolvedValue({ ...portfolio }) });
      const eRepo = makeEnrollmentRepo();
      const cRepo = makeCertificateRepo();

      eRepo.find = jest.fn().mockResolvedValue([]);
      cRepo.find = jest.fn().mockResolvedValue([]);

      const service = makeService(pRepo, eRepo, cRepo);
      const result = await service.updatePortfolio('user-1', { isPublic: true });

      const savedEntity = pRepo.save.mock.calls[0][0];
      expect(savedEntity.isPublic).toBe(true);
      expect(result).toBeDefined();
    });

    it('updates displayName and bio', async () => {
      const pRepo = makePortfolioRepo({ findOne: jest.fn().mockResolvedValue({ ...portfolio }) });
      const eRepo = makeEnrollmentRepo();
      const cRepo = makeCertificateRepo();

      eRepo.find = jest.fn().mockResolvedValue([]);
      cRepo.find = jest.fn().mockResolvedValue([]);

      const service = makeService(pRepo, eRepo, cRepo);
      await service.updatePortfolio('user-1', { displayName: 'Alice Dev', bio: 'Hello world' });

      const savedEntity = pRepo.save.mock.calls[0][0];
      expect(savedEntity.displayName).toBe('Alice Dev');
      expect(savedEntity.bio).toBe('Hello world');
    });

    it('does not overwrite fields that are not in the DTO', async () => {
      const pRepo = makePortfolioRepo({
        findOne: jest.fn().mockResolvedValue({ ...portfolio, displayName: 'Alice', bio: 'Existing bio' }),
      });
      const eRepo = makeEnrollmentRepo();
      const cRepo = makeCertificateRepo();

      eRepo.find = jest.fn().mockResolvedValue([]);
      cRepo.find = jest.fn().mockResolvedValue([]);

      const service = makeService(pRepo, eRepo, cRepo);
      // Only update isPublic, do not touch displayName / bio
      await service.updatePortfolio('user-1', { isPublic: true });

      const savedEntity = pRepo.save.mock.calls[0][0];
      expect(savedEntity.displayName).toBe('Alice');
      expect(savedEntity.bio).toBe('Existing bio');
    });
  });

  // ── regenerateSlug ──────────────────────────────────────────────────────────

  describe('regenerateSlug', () => {
    it('generates a new unique slug and saves it', async () => {
      const pRepo = makePortfolioRepo({ findOne: jest.fn().mockResolvedValue({ ...portfolio }) });
      const service = makeService(pRepo);

      const { publicSlug } = await service.regenerateSlug('user-1');

      expect(publicSlug).not.toBe(portfolio.publicSlug);
      expect(publicSlug).toMatch(/^[0-9a-f]{24}$/);
      expect(pRepo.save).toHaveBeenCalledTimes(1);
    });
  });
});

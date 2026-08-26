import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, IsNull } from 'typeorm';
import { randomBytes } from 'crypto';
import { Portfolio } from './portfolio.entity';
import { Enrollment } from '../enrollments/enrollment.entity';
import { Certificate } from '../certificates/certificate.entity';
import { UpdatePortfolioDto } from './dto/update-portfolio.dto';
import {
  PortfolioResponseDto,
  PortfolioCourseDto,
  PortfolioCertificateDto,
  PortfolioBadgeDto,
  PortfolioStatsDto,
} from './dto/portfolio-response.dto';

// Stub badge type until a dedicated Badges table is implemented.
interface BadgeRecord {
  id: string;
  name: string;
  description: string;
  iconUrl: string;
  awardedAt: string;
}

@Injectable()
export class PortfolioService {
  private readonly logger = new Logger(PortfolioService.name);

  constructor(
    @InjectRepository(Portfolio)
    private readonly portfolioRepository: Repository<Portfolio>,

    @InjectRepository(Enrollment)
    private readonly enrollmentRepository: Repository<Enrollment>,

    @InjectRepository(Certificate)
    private readonly certificateRepository: Repository<Certificate>,
  ) {}

  // ── Public helpers ────────────────────────────────────────────────────────

  /**
   * Returns (or lazily creates) the portfolio for a given user.
   * The portfolio is created private by default on first access.
   */
  async getOrCreate(userId: string): Promise<Portfolio> {
    const existing = await this.portfolioRepository.findOne({ where: { userId } });
    if (existing) return existing;

    const portfolio = this.portfolioRepository.create({
      userId,
      publicSlug: this.generateSlug(),
      isPublic: false,
    });

    const saved = await this.portfolioRepository.save(portfolio);
    this.logger.log(`Portfolio auto-created for user=${userId} slug=${saved.publicSlug}`);
    return saved;
  }

  /**
   * Fetches the full portfolio payload for a user (authenticated owner view).
   * Creates the portfolio record if it does not yet exist.
   */
  async getMyPortfolio(userId: string): Promise<PortfolioResponseDto> {
    const portfolio = await this.getOrCreate(userId);
    return this.buildResponse(portfolio);
  }

  /**
   * Fetches a public portfolio by its slug.
   * Throws 404 if the slug does not exist or the portfolio is private.
   */
  async getPublicPortfolio(slug: string): Promise<PortfolioResponseDto> {
    const portfolio = await this.portfolioRepository.findOne({
      where: { publicSlug: slug, isPublic: true },
    });

    if (!portfolio) {
      throw new NotFoundException('Portfolio not found or is not public');
    }

    return this.buildResponse(portfolio);
  }

  /**
   * Updates mutable portfolio fields.
   * Only the owner may call this; caller must validate userId === req.user.id
   * before invoking this method (enforced in the controller).
   */
  async updatePortfolio(
    userId: string,
    dto: UpdatePortfolioDto,
  ): Promise<PortfolioResponseDto> {
    const portfolio = await this.getOrCreate(userId);

    if (dto.displayName !== undefined) portfolio.displayName = dto.displayName;
    if (dto.bio !== undefined) portfolio.bio = dto.bio;
    if (dto.isPublic !== undefined) portfolio.isPublic = dto.isPublic;

    const saved = await this.portfolioRepository.save(portfolio);
    this.logger.log(`Portfolio updated for user=${userId}`);
    return this.buildResponse(saved);
  }

  /**
   * Regenerates the public slug so old shared links are invalidated.
   */
  async regenerateSlug(userId: string): Promise<{ publicSlug: string }> {
    const portfolio = await this.getOrCreate(userId);
    portfolio.publicSlug = this.generateSlug();
    const saved = await this.portfolioRepository.save(portfolio);
    this.logger.log(`Slug regenerated for user=${userId} newSlug=${saved.publicSlug}`);
    return { publicSlug: saved.publicSlug };
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  private generateSlug(): string {
    // 12 random bytes → 24 hex chars, globally unique and URL-safe
    return randomBytes(12).toString('hex');
  }

  /**
   * Assembles the full PortfolioResponseDto from the portfolio record plus
   * related data (enrollments, certificates, badges).
   */
  private async buildResponse(portfolio: Portfolio): Promise<PortfolioResponseDto> {
    const [completedEnrollments, certificates] = await Promise.all([
      this.enrollmentRepository.find({
        where: { userId: portfolio.userId, completedAt: Not(IsNull()) },
        relations: ['course'],
        order: { completedAt: 'DESC' },
      }),
      this.certificateRepository.find({
        where: { userId: portfolio.userId },
        relations: ['course'],
        order: { issuedAt: 'DESC' },
      }),
    ]);

    // Build completed-courses list
    const completedCourses: PortfolioCourseDto[] = completedEnrollments
      .filter((e) => e.course)
      .map((e) => ({
        courseId: e.courseId,
        title: e.course.title,
        description: e.course.description,
        thumbnailUrl: e.course.thumbnailUrl ?? null,
        level: e.course.level,
        durationHours: e.course.durationHours,
        completedAt: (e.completedAt as Date).toISOString(),
      }));

    // Build certificates list
    const portfolioCertificates: PortfolioCertificateDto[] = certificates
      .filter((c) => c.status !== 'pending' && !c.revokedAt)
      .map((c) => ({
        certificateId: c.id,
        courseId: c.courseId,
        courseTitle: c.course?.title ?? c.courseId,
        certificateHash: c.certificateHash,
        stellarTransactionId: c.stellarTransactionId ?? null,
        pdfUrl: c.pdfUrl ?? null,
        issuedAt: c.issuedAt.toISOString(),
      }));

    // Badges: stub implementation — returns an empty array until the badges
    // table is implemented. The response shape is already defined so the
    // frontend can consume it without changes.
    const badges: PortfolioBadgeDto[] = this.getStubBadges();

    // Aggregate stats
    const stats: PortfolioStatsDto = {
      totalCourses: completedCourses.length,
      totalHours: completedCourses.reduce((sum, c) => sum + (c.durationHours || 0), 0),
      totalCertificates: portfolioCertificates.length,
      totalBadges: badges.length,
    };

    return {
      id: portfolio.id,
      userId: portfolio.userId,
      publicSlug: portfolio.publicSlug,
      isPublic: portfolio.isPublic,
      displayName: portfolio.displayName,
      bio: portfolio.bio,
      createdAt: portfolio.createdAt.toISOString(),
      updatedAt: portfolio.updatedAt.toISOString(),
      stats,
      completedCourses,
      certificates: portfolioCertificates,
      badges,
    };
  }

  /**
   * Placeholder badge data.
   * Replace this with a real BadgesService.getUserBadges(userId) call
   * once the badges module exists.
   */
  private getStubBadges(): BadgeRecord[] {
    return [];
  }
}

import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, IsNull, In, MoreThanOrEqual } from 'typeorm';
import { OnEvent } from '@nestjs/event-emitter';
import { Certificate } from './certificate.entity';
import { Enrollment } from '../enrollments/enrollment.entity';
import { Progress } from '../progress/progress.entity';
import { CourseModule } from '../courses/course-module.entity';
import { Lesson } from '../courses/lesson.entity';
import { StellarService } from '../stellar/stellar.service';
import * as crypto from 'crypto';

/** Shape returned by GET /v1/certificates/:id/verify */
export interface CertificateVerificationResult {
  verified: boolean;
  certificateId: string;
  studentId: string;
  courseId: string;
  certificateHash: string;
  issuedAt: string;
  transactionHash: string | null;
  onChain: {
    found: boolean;
    successful: boolean | null;
    ledgerTimestamp: string | null;
  };
}

@Injectable()
export class CertificatesService {
  private readonly logger = new Logger(CertificatesService.name);

  constructor(
    @InjectRepository(Certificate)
    private certificatesRepository: Repository<Certificate>,
    @InjectRepository(Enrollment)
    private enrollmentsRepository: Repository<Enrollment>,
    private stellarService: StellarService,
    @InjectRepository(Progress)
    private progressRepository: Repository<Progress>,
    @InjectRepository(CourseModule)
    private courseModuleRepository: Repository<CourseModule>,
    @InjectRepository(Lesson)
    private lessonRepository: Repository<Lesson>,
  ) {}

  // ── Event-driven trigger ──────────────────────────────────────────────────

  /**
   * Automatically issues a certificate when a student reaches 100% progress.
   * Listens on both `course.completed` (canonical domain event) and the legacy
   * `progress.completed` alias — both are emitted by ProgressService.
   * Errors are swallowed here so a certificate failure never rolls back the
   * progress record.
   */
  @OnEvent('course.completed')
  @OnEvent('progress.completed')
  async handleProgressCompleted(payload: {
    userId: string;
    courseId: string;
    stellarPublicKey: string;
    courseName: string;
  }): Promise<void> {
    try {
      await this.issueCertificate(payload.userId, payload.courseId);
      this.logger.log(
        `Certificate auto-issued for user=${payload.userId} course=${payload.courseId}`,
      );
    } catch (err: unknown) {
      // ConflictException = already issued — treat as success
      if (err instanceof ConflictException) return;
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      const stack = err instanceof Error ? err.stack : undefined;
      this.logger.error(
        `Auto-issuance failed for user=${payload.userId} course=${payload.courseId}: ${errorMessage}`,
        stack,
      );
    }
  }

  // ── Core issuance ─────────────────────────────────────────────────────────

  /**
   * Issues an on-chain certificate for a completed course.
   *
   * Guards:
   *  1. Enrollment must exist AND completedAt must be set (course finished)
   *  2. No duplicate — throws ConflictException if one already exists
   *  3. Row is saved as 'pending' first; on-chain failure removes it so the
   *     database is never left in an inconsistent state
   */
  async issueCertificate(userId: string, courseId: string): Promise<Certificate> {
    // 1. Verify the enrollment exists and the course has been completed
    const enrollment = await this.enrollmentsRepository.findOne({
      where: { userId, courseId },
      relations: ['user', 'course'],
    });

    if (!enrollment) {
      throw new BadRequestException(
        'Enrollment not found or course not yet completed',
      );
    }

    const hasCompletedAllLessons = await this.hasCompletedAllCourseLessons(userId, courseId);
    if (!enrollment.completedAt && !hasCompletedAllLessons) {
      throw new BadRequestException(
        'Course is not fully completed; all lessons must be marked complete before issuing a certificate',
      );
    }

    if (!hasCompletedAllLessons) {
      throw new BadRequestException(
        'Course is not fully completed; all lessons must be marked complete before issuing a certificate',
      );
    }

    // 2. Idempotency check — prevent double issuance
    const existing = await this.certificatesRepository.findOne({
      where: { userId, courseId },
    });

    if (existing) {
      throw new ConflictException('Certificate already issued for this course');
    }

    // 3. Deterministic hash: same inputs always produce the same hash,
    //    which means concurrent duplicate requests hash to the same value
    //    and the DB unique constraint on (userId, courseId) blocks the second.
    const certificateHash = this.generateCertificateHash(userId, courseId);

    // 4. Persist as 'pending' so we have a record even if the RPC call hangs
    const certificate = await this.certificatesRepository.save(
      this.certificatesRepository.create({
        userId,
        courseId,
        certificateHash,
        status: 'pending',
      }),
    );

    // 5. Invoke the Soroban certificate contract
    const recipientPublicKey = enrollment.user?.stellarPublicKey;
    const courseTitle = enrollment.course?.title ?? courseId;

    if (!recipientPublicKey) {
      // No Stellar key on the user — skip on-chain, mark as minted off-chain
      this.logger.warn(
        `User ${userId} has no stellarPublicKey — certificate stored off-chain only`,
      );
      certificate.status = 'minted';
      return this.certificatesRepository.save(certificate);
    }

    try {
      const txHash = await this.stellarService.mintCertificateNFT(
        recipientPublicKey,
        certificateHash,
        courseTitle,
      );

      certificate.stellarTransactionId = txHash;
      certificate.status = 'minted';
      await this.certificatesRepository.save(certificate);

      this.logger.log(
        `Certificate minted on-chain — user=${userId} course=${courseId} tx=${txHash}`,
      );
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const stack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `On-chain certificate minting failed for user=${userId} course=${courseId}: ${errorMessage}`,
        stack,
      );

      // Roll back the pending row so we don't leave a ghost record
      await this.certificatesRepository.remove(certificate).catch((removeErr) =>
        this.logger.error(`Failed to remove pending certificate: ${removeErr.message}`),
      );

      throw new InternalServerErrorException({
        message:
          'Failed to mint certificate on the Stellar network. Please try again.',
        detail: errorMessage,
      });
    }

    return this.toCertificateResponse(certificate);
  }

  // ── Verification endpoint logic ───────────────────────────────────────────

  /**
   * Verifies a certificate by its database ID.
   *
   * Steps:
   *  1. Load the certificate row
   *  2. If a stellarTransactionId is present, query Horizon to confirm the
   *     transaction exists and was successful
   *  3. Return a structured payload combining the DB record and network result
   */
  async verifyById(id: string): Promise<CertificateVerificationResult> {
    const cert = await this.certificatesRepository.findOne({
      where: { id },
      relations: ['user', 'course'],
    });

    if (!cert) {
      throw new NotFoundException('Certificate not found');
    }

    let onChain: CertificateVerificationResult['onChain'] = {
      found: false,
      successful: null,
      ledgerTimestamp: null,
    };

    if (cert.stellarTransactionId) {
      try {
        const txRecords = await this.stellarService.getTransactions(
          // getTransactions fetches by account; use a dedicated lookup instead
          cert.userId,
          200,
        );

        // Search the fetched transactions for a matching hash
        const match = (txRecords as Array<{ hash: string; successful: boolean; createdAt: string }>)
          .find((tx) => tx.hash === cert.stellarTransactionId);

        if (match) {
          onChain = {
            found: true,
            successful: match.successful,
            ledgerTimestamp: match.createdAt,
          };
        }
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        this.logger.warn(`Horizon lookup failed during verification: ${errorMessage}`);
        // Not fatal — we still return the DB record; onChain.found remains false
      }
    }

    const dbVerified =
      cert.status === 'minted' || cert.status === 'verified';

    return {
      verified: dbVerified && (onChain.found ? onChain.successful === true : true),
      certificateId: cert.id,
      studentId: cert.userId,
      courseId: cert.courseId,
      certificateHash: cert.certificateHash,
      issuedAt: cert.issuedAt.toISOString(),
      transactionHash: cert.stellarTransactionId ?? null,
      onChain,
    };
  }

  // ── Read methods ──────────────────────────────────────────────────────────

  async getCertificate(id: string): Promise<Certificate> {
    const cert = await this.certificatesRepository.findOne({ where: { id } });
    if (!cert) throw new NotFoundException('Certificate not found');
    return cert;
  }

  async getCertificateWithRelations(id: string): Promise<Certificate> {
    const cert = await this.certificatesRepository.findOne({
      where: { id },
      relations: ['user', 'course'],
    });
    if (!cert) throw new NotFoundException('Certificate not found');
    return cert;
  }

  async getUserCertificates(userId: string): Promise<Certificate[]> {
    return this.certificatesRepository.find({
      where: { userId },
      relations: ['course'],
      order: { issuedAt: 'DESC' },
    });
  }

  /** Legacy hash-based verification — kept for backwards compatibility */
  async verifyCertificate(
    certificateHash: string,
  ): Promise<{ valid: boolean; certificate?: Certificate }> {
    const cert = await this.certificatesRepository.findOne({
      where: { certificateHash },
      relations: ['user', 'course'],
    });

    if (!cert) return { valid: false };

    if (cert.revokedAt) {
      throw new HttpException(
        {
          valid: false,
          reason: 'revoked',
          revokedAt: cert.revokedAt,
        },
        HttpStatus.GONE,
      );
    }

    return {
      valid: cert.status === 'minted' || cert.status === 'verified',
      certificate: cert,
    };
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  /**
   * Deterministic hash: same userId + courseId always produce the same value.
   * This is intentional — if two concurrent requests race through the
   * idempotency check, the DB unique constraint on (userId, courseId) will
   * reject the second INSERT cleanly.
   */
  private generateCertificateHash(userId: string, courseId: string): string {
    return crypto
      .createHash('sha256')
      .update(`${userId}:${courseId}`)
      .digest('hex');
  }

  private async hasCompletedAllCourseLessons(userId: string, courseId: string): Promise<boolean> {
    const modules = await this.courseModuleRepository.find({
      where: { courseId },
      select: ['id'],
    });

    if (modules.length === 0) {
      return false;
    }

    const moduleIds = modules.map((module) => module.id);
    const lessons = await this.lessonRepository.find({
      where: { moduleId: In(moduleIds) },
      select: ['id'],
    });

    if (lessons.length === 0) {
      return false;
    }

    const completedLessons = await this.progressRepository.find({
      where: {
        userId,
        courseId,
        lessonId: In(lessons.map((lesson) => lesson.id)),
        progressPct: MoreThanOrEqual(100),
      },
      select: ['lessonId'],
    });

    const completedLessonIds = new Set(
      completedLessons
        .map((progressRow) => progressRow.lessonId)
        .filter((lessonId): lessonId is string => Boolean(lessonId)),
    );

    return lessons.every((lesson) => completedLessonIds.has(lesson.id));
  }

  private toCertificateResponse(certificate: Certificate): Certificate & {
    txHash: string | null;
    stellarExplorerUrl: string | null;
  } {
    const txHash = certificate.stellarTransactionId ?? null;
    return {
      ...certificate,
      txHash,
      stellarExplorerUrl: txHash ? this.stellarService.getTransactionExplorerUrl(txHash) : null,
    };
  }
}

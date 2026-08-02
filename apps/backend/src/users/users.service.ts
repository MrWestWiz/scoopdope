import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { Post } from '../forums/post.entity';
import { Review } from '../courses/review.entity';

/** Stable UUID used as the author for anonymized forum posts. */
export const ANONYMOUS_USER_ID = '00000000-0000-0000-0000-000000000000';

export interface ExportedUserData {
  profile: Partial<User>;
  enrollments: any[];
  certificates: any[];
  credentials: any[];
  auditLogs: any[];
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private repo: Repository<User>,
    @InjectRepository(Post) private postRepo: Repository<Post>,
    @InjectRepository(Review) private reviewRepo: Repository<Review>,
  ) {}

  findByEmail(email: string) {
    return this.repo.findOne({ where: { email } });
  }

  findByEmailWithPassword(email: string) {
    return this.repo
      .createQueryBuilder('user')
      .where('user.email = :email', { email })
      .addSelect('user.passwordHash')
      .getOne();
  }

  findByVerificationToken(hash: string) {
    return this.repo.findOne({ where: { verificationToken: hash } });
  }

  findById(id: string) {
    return this.repo.findOne({ where: { id } });
  }

  findByIdWithPassword(id: string) {
    return this.repo
      .createQueryBuilder('user')
      .where('user.id = :id', { id })
      .addSelect('user.passwordHash')
      .getOne();
  }

  findByStellarPublicKey(stellarPublicKey: string) {
    return this.repo.findOne({ where: { stellarPublicKey } });
  }

  create(data: Partial<User>) {
    return this.repo.save(this.repo.create(data));
  }

  async update(id: string, data: Partial<User>) {
    const user = await this.findById(id);
    if (!user) throw new NotFoundException('User not found');
    return this.repo.save({ ...user, ...data });
  }

  async findAll(
    options: {
      page?: number;
      limit?: number;
      role?: string;
      isVerified?: boolean;
      search?: string;
    } = {}
  ) {
    const { page = 1, limit = 10, role, isVerified, search } = options;

    const query = this.repo.createQueryBuilder('user');

    if (role) {
      query.andWhere('user.role = :role', { role });
    }

    if (isVerified !== undefined) {
      query.andWhere('user.isVerified = :isVerified', { isVerified });
    }

    if (search) {
      query.andWhere('user.email ILIKE :search', { search: `%${search}%` });
    }

    query.andWhere('user.deletedAt IS NULL');

    const [users, total] = await query
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('user.createdAt', 'DESC')
      .getManyAndCount();

    return {
      data: users,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async banUser(id: string, isBanned: boolean) {
    const user = await this.findById(id);
    if (!user) throw new NotFoundException('User not found');
    return this.repo.save({ ...user, isBanned });
  }

  async changeRole(id: string, role: string) {
    const user = await this.findById(id);
    if (!user) throw new NotFoundException('User not found');
    return this.repo.save({ ...user, role });
  }

  async softDelete(id: string) {
    const user = await this.findById(id);
    if (!user) throw new NotFoundException('User not found');
    return this.repo.save({ ...user, deletedAt: new Date() });
  }

  findByReferralCode(code: string) {
    return this.repo.findOne({ where: { referralCode: code } });
  }

  async getReferralStats(userId: string) {
    const count = await this.repo.count({ where: { referredBy: userId } });
    return { referralCount: count, earnedBst: count * 50 };
  }

  async exportUserData(id: string): Promise<ExportedUserData> {
    const user = await this.findById(id);
    if (!user) throw new NotFoundException('User not found');

    const { passwordHash, mfaSecret, mfaBackupCodes, verificationToken, ...safeProfile } = user;

    return {
      profile: safeProfile,
      enrollments: [],
      certificates: [],
      credentials: [],
      auditLogs: [],
    };
  }

  async anonymizeUser(id: string): Promise<void> {
    const user = await this.findById(id);
    if (!user) throw new NotFoundException('User not found');

    const anonymizedEmail = `deleted-${id.slice(0, 8)}@anonymized.invalid`;
    const anonymizedUsername = `deleted-user-${id.slice(0, 8)}`;

    // Reassign forum posts to the anonymous placeholder user so thread
    // continuity is preserved (replies to these posts still have a parent).
    await this.postRepo.update({ userId: id }, { userId: ANONYMOUS_USER_ID });

    // Anonymize course reviews in-place: detach the author identity
    // by clearing the userId link rather than deleting the review row,
    // keeping course ratings intact.
    await this.reviewRepo.update({ userId: id }, { userId: ANONYMOUS_USER_ID });

    // Scrub all PII from the user row and mark it as deleted.
    await this.repo.save({
      ...user,
      email: anonymizedEmail,
      username: anonymizedUsername,
      passwordHash: '',
      avatar: null,
      bio: null,
      stellarPublicKey: null,
      referralCode: null,
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      deletedAt: new Date(),
    });
  }
}

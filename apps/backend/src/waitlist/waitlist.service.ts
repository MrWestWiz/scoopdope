import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { OnEvent } from '@nestjs/event-emitter';
import { WaitlistEntry } from './waitlist-entry.entity';
import { Course } from '../courses/course.entity';
import { Enrollment } from '../enrollments/enrollment.entity';
import { User } from '../users/user.entity';

@Injectable()
export class WaitlistService {
  constructor(
    @InjectRepository(WaitlistEntry)
    private waitlistRepo: Repository<WaitlistEntry>,
    @InjectRepository(Course)
    private courseRepo: Repository<Course>,
    @InjectRepository(Enrollment)
    private enrollmentRepo: Repository<Enrollment>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
    private eventEmitter: EventEmitter2,
    private dataSource: DataSource,
  ) {}

  /**
   * Returns the current enrollment count for a course.
   */
  async getEnrollmentCount(courseId: string): Promise<number> {
    return this.enrollmentRepo.count({ where: { courseId } });
  }

  /**
   * Returns whether a course is full (maxEnrollment set and reached).
   */
  async isFull(courseId: string): Promise<boolean> {
    const course = await this.courseRepo.findOne({ where: { id: courseId } });
    if (!course || !course.maxEnrollment) return false;
    const count = await this.getEnrollmentCount(courseId);
    return count >= course.maxEnrollment;
  }

  /**
   * Join the waitlist for a course.
   */
  async join(userId: string, courseId: string): Promise<WaitlistEntry> {
    const course = await this.courseRepo.findOne({ where: { id: courseId } });
    if (!course) throw new NotFoundException('Course not found');

    // Must be a published course
    if (!course.isPublished && course.status !== 'published') {
      throw new BadRequestException('Course is not available for enrollment or waitlisting');
    }

    // Already enrolled?
    const enrolled = await this.enrollmentRepo.findOne({ where: { userId, courseId } });
    if (enrolled) throw new ConflictException('Already enrolled in this course');

    // Already on waitlist?
    const existing = await this.waitlistRepo.findOne({ where: { userId, courseId } });
    if (existing) throw new ConflictException('Already on the waitlist for this course');

    // If course is not full, they should just enroll directly
    const full = await this.isFull(courseId);
    if (!full) {
      throw new BadRequestException(
        'Course has available spots — please enroll directly',
      );
    }

    // Determine next position
    const maxPos = await this.waitlistRepo
      .createQueryBuilder('w')
      .select('MAX(w.position)', 'max')
      .where('w.courseId = :courseId', { courseId })
      .getRawOne<{ max: string | null }>();

    const position = (Number(maxPos?.max) || 0) + 1;

    const entry = await this.waitlistRepo.save(
      this.waitlistRepo.create({ userId, courseId, position }),
    );

    const user = await this.userRepo.findOne({ where: { id: userId } });

    this.eventEmitter.emit('waitlist.joined', {
      userId,
      courseId,
      courseTitle: course.title,
      position,
      userEmail: user?.email ?? '',
      userName: user?.username ?? user?.email ?? 'Student',
    });

    return entry;
  }

  /**
   * Leave the waitlist.
   */
  async leave(userId: string, courseId: string): Promise<void> {
    const entry = await this.waitlistRepo.findOne({ where: { userId, courseId } });
    if (!entry) throw new NotFoundException('Not on the waitlist for this course');

    const removedPosition = entry.position;
    await this.waitlistRepo.remove(entry);

    // Compact positions for remaining entries
    await this.waitlistRepo
      .createQueryBuilder()
      .update(WaitlistEntry)
      .set({ position: () => 'position - 1' })
      .where('courseId = :courseId AND position > :pos', {
        courseId,
        pos: removedPosition,
      })
      .execute();
  }

  /**
   * Get a user's waitlist position for a course (null if not on waitlist).
   */
  async getPosition(userId: string, courseId: string): Promise<number | null> {
    const entry = await this.waitlistRepo.findOne({ where: { userId, courseId } });
    return entry?.position ?? null;
  }

  /**
   * Get all waitlist entries for a course (admin view), ordered by position.
   */
  async listForCourse(courseId: string): Promise<WaitlistEntry[]> {
    return this.waitlistRepo.find({
      where: { courseId },
      relations: ['user'],
      order: { position: 'ASC' },
    });
  }

  /**
   * Get all waitlist entries for a user.
   */
  async listForUser(userId: string): Promise<WaitlistEntry[]> {
    return this.waitlistRepo.find({
      where: { userId },
      relations: ['course'],
      order: { joinedAt: 'ASC' },
    });
  }

  /**
   * Admin: remove a specific user from a course waitlist.
   */
  async adminRemove(courseId: string, userId: string): Promise<void> {
    return this.leave(userId, courseId);
  }

  /**
   * Attempt to auto-enroll the next person on the waitlist when a spot opens.
   * Called after a student unenrolls or when maxEnrollment is increased.
   */
  async promoteNext(courseId: string): Promise<void> {
    const course = await this.courseRepo.findOne({ where: { id: courseId } });
    if (!course || !course.maxEnrollment) return;

    const currentCount = await this.getEnrollmentCount(courseId);
    if (currentCount >= course.maxEnrollment) return;

    // Get the first person on the waitlist
    const next = await this.waitlistRepo.findOne({
      where: { courseId, position: 1 },
      relations: ['user'],
    });
    if (!next) return;

    // Use a transaction to atomically enroll and remove from waitlist
    await this.dataSource.transaction(async (manager) => {
      // Create enrollment
      const enrollmentRepo = manager.getRepository(Enrollment);
      const existing = await enrollmentRepo.findOne({
        where: { userId: next.userId, courseId },
      });
      if (!existing) {
        await enrollmentRepo.save(
          enrollmentRepo.create({ userId: next.userId, courseId }),
        );
      }

      // Remove from waitlist
      await manager.getRepository(WaitlistEntry).remove(next);

      // Compact remaining positions
      await manager
        .getRepository(WaitlistEntry)
        .createQueryBuilder()
        .update(WaitlistEntry)
        .set({ position: () => 'position - 1' })
        .where('courseId = :courseId', { courseId })
        .execute();
    });

    const user = next.user;
    this.eventEmitter.emit('waitlist.enrolled', {
      userId: next.userId,
      courseId,
      courseTitle: course.title,
      userEmail: user?.email ?? '',
      userName: user?.username ?? user?.email ?? 'Student',
    });

    this.eventEmitter.emit('enrollment.created', {
      enrollmentId: '',
      userId: next.userId,
      courseId,
      enrolledAt: new Date(),
      userEmail: user?.email ?? '',
      userName: user?.username ?? user?.email ?? 'Student',
      courseTitle: course.title,
    });
  }

  /**
   * Returns waitlist size for a course.
   */
  async getWaitlistCount(courseId: string): Promise<number> {
    return this.waitlistRepo.count({ where: { courseId } });
  }

  /**
   * Triggered when a student unenrolls — attempt to promote the next person.
   */
  @OnEvent('enrollment.removed')
  async handleEnrollmentRemoved(payload: { courseId: string }): Promise<void> {
    await this.promoteNext(payload.courseId);
  }
}

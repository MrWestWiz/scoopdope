import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Announcement } from './announcement.entity';
import { Enrollment } from '../enrollments/enrollment.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/notification.entity';

@Injectable()
export class AnnouncementsService {
  constructor(
    @InjectRepository(Announcement) private repo: Repository<Announcement>,
    @InjectRepository(Enrollment) private enrollmentRepo: Repository<Enrollment>,
    private notifications: NotificationsService,
  ) {}

  async create(
    instructorId: string,
    courseId: string,
    title: string,
    body: string,
  ): Promise<Announcement> {
    const announcement = await this.repo.save(
      this.repo.create({ instructorId, courseId, title, body }),
    );

    // Notify all enrolled students
    const enrollments = await this.enrollmentRepo.find({ where: { courseId } });
    await Promise.all(
      enrollments.map((e) =>
        this.notifications.create(
          e.userId,
          NotificationType.ANNOUNCEMENT,
          `New announcement in your course: "${title}"`,
        ),
      ),
    );

    return announcement;
  }

  async findByCourse(courseId: string): Promise<Announcement[]> {
    return this.repo.find({
      where: { courseId },
      relations: ['instructor'],
      order: { createdAt: 'DESC' },
    });
  }

  async remove(id: string, instructorId: string): Promise<void> {
    const a = await this.repo.findOne({ where: { id } });
    if (!a) throw new NotFoundException('Announcement not found');
    if (a.instructorId !== instructorId) throw new ForbiddenException();
    await this.repo.remove(a);
  }
}

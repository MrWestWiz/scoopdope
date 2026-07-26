import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QaQuestion } from './qa-question.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/notification.entity';

@Injectable()
export class QaService {
  constructor(
    @InjectRepository(QaQuestion) private repo: Repository<QaQuestion>,
    private notifications: NotificationsService,
  ) {}

  async ask(
    userId: string,
    courseId: string,
    body: string,
    timestampSeconds?: number,
    instructorId?: string,
  ): Promise<QaQuestion> {
    const question = await this.repo.save(
      this.repo.create({ userId, courseId, body, timestampSeconds }),
    );
    // Notify instructor if known
    if (instructorId) {
      await this.notifications.create(
        instructorId,
        NotificationType.QA_QUESTION,
        `New question in your course: "${body.slice(0, 80)}"`,
      );
    }
    return question;
  }

  async findByCourse(courseId: string): Promise<QaQuestion[]> {
    return this.repo.find({
      where: { courseId },
      relations: ['user'],
      order: { upvotes: 'DESC', createdAt: 'ASC' },
    });
  }

  async answer(id: string, answeredByUserId: string, answer: string): Promise<QaQuestion> {
    const q = await this.repo.findOne({ where: { id } });
    if (!q) throw new NotFoundException('Question not found');
    q.answer = answer;
    q.answeredByUserId = answeredByUserId;
    q.answeredAt = new Date();
    const saved = await this.repo.save(q);
    // Notify the student who asked
    await this.notifications.create(
      q.userId,
      NotificationType.QA_ANSWER,
      `Your question was answered: "${q.body.slice(0, 60)}"`,
    );
    return saved;
  }

  async upvote(id: string): Promise<QaQuestion> {
    const q = await this.repo.findOne({ where: { id } });
    if (!q) throw new NotFoundException('Question not found');
    q.upvotes += 1;
    return this.repo.save(q);
  }

  async remove(id: string, userId: string): Promise<void> {
    const q = await this.repo.findOne({ where: { id } });
    if (!q) throw new NotFoundException('Question not found');
    if (q.userId !== userId) throw new ForbiddenException();
    await this.repo.remove(q);
  }
}

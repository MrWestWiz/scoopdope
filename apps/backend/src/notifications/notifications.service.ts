import { Injectable, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType } from './notification.entity';
import { PushSubscription } from './push-subscription.entity';
import { NotificationsGateway } from './notifications.gateway';
import { User } from '../users/user.entity';
import { PushNotificationsService } from './push-notifications.service';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification) private repo: Repository<Notification>,
    @InjectRepository(User) private userRepo: Repository<User>,
    @Inject(forwardRef(() => NotificationsGateway))
    private gateway: NotificationsGateway,
    private pushNotificationsService: PushNotificationsService
  ) {}

  async updatePreferences(userId: string, preferences: any) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    user.notificationPreferences = {
      ...user.notificationPreferences,
      ...preferences,
    };

    return this.userRepo.save(user);
  }

  async create(userId: string, type: NotificationType, message: string) {
    const notification = this.repo.create({ userId, type, message });
    const saved = await this.repo.save(notification);
    this.gateway.emitToUser(userId, 'notification', saved);

    // Send push notification if enabled
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (user && user.notificationPreferences?.pushEnabled) {
      let shouldSendPush = false;
      const prefs = user.notificationPreferences;

      switch (type) {
        case NotificationType.ENROLLMENT:
        case NotificationType.COMPLETION:
        case NotificationType.COURSE_PUBLISHED:
        case NotificationType.ANNOUNCEMENT:
          shouldSendPush = prefs.courseUpdates;
          break;
        case NotificationType.CREDENTIAL_ISSUED:
          shouldSendPush = prefs.tokenRewards;
          break;
        case NotificationType.QA_QUESTION:
        case NotificationType.QA_ANSWER:
          shouldSendPush = true; // Always send for Q&A if push is enabled? Or add a pref?
          break;
        // Add more cases as needed
      }

      if (shouldSendPush) {
        await this.pushNotificationsService.sendNotification(userId, {
          title: 'ScoopDope',
          body: message,
          icon: '/icons/icon-192x192.png',
          url: '/notifications',
        });
      }
    }

    return saved;
  }

  async findByUser(userId: string) {
    return this.repo.find({
      where: { userId },
      order: { isRead: 'ASC', createdAt: 'DESC' },
    });
  }

  async markAsRead(id: string) {
    const notification = await this.repo.findOne({ where: { id } });
    if (!notification) throw new NotFoundException('Notification not found');
    notification.isRead = true;
    return this.repo.save(notification);
  }

  async markAllAsRead(userId: string) {
    await this.repo.update({ userId, isRead: false }, { isRead: true });
    return { success: true };
  }

  // Event handlers for automatic notifications
  async onEnrollmentCreated(userId: string, courseName: string) {
    return this.create(
      userId,
      NotificationType.ENROLLMENT,
      `You have been enrolled in ${courseName}`
    );
  }

  async onCredentialIssued(userId: string, courseName: string) {
    return this.create(
      userId,
      NotificationType.CREDENTIAL_ISSUED,
      `Your credential for ${courseName} has been issued!`
    );
  }

  async onProgressCompleted(userId: string, courseName: string) {
    return this.create(
      userId,
      NotificationType.COMPLETION,
      `Congratulations! You have completed ${courseName}`
    );
  }
}

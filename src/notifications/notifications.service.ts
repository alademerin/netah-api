import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityManager, EntityRepository } from '@mikro-orm/postgresql';
import { Notification, NotificationType } from 'src/tasks/entities/notification.entity';
import { User } from 'src/users/entities/user.entity';
import { Task } from 'src/tasks/entities/task.entity';
import { TaskBid } from 'src/tasks/entities/task-bid.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepo: EntityRepository<Notification>,

    private readonly em: EntityManager,
  ) {}

  async createNotification(
    user: User,
    type: NotificationType,
    title: string,
    message: string,
    task?: Task,
    taskBid?: TaskBid,
  ) {
    const notification = this.notificationRepo.create({
      user,
      type,
      title,
      message,
      task,
      taskBid,
      isRead: false,
    });

    await this.em.persistAndFlush(notification);
    return notification;
  }

  async getNotifications(currentUser: User) {
    const notifications = await this.notificationRepo.find(
      { user: currentUser },
      {
        orderBy: { createdAt: 'DESC' },
        populate: ['task', 'taskBid'],
      },
    );

    return notifications.map((notification) => ({
      id: notification.id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      isRead: notification.isRead,
      createdAt: notification.createdAt,
      readAt: notification.readAt,
      task: notification.task
        ? {
            id: notification.task.id,
            publicId: notification.task.publicId,
            title: notification.task.title,
          }
        : null,
      taskBid: notification.taskBid
        ? {
            id: notification.taskBid.id,
            amount: notification.taskBid.amount,
          }
        : null,
    }));
  }

  async markNotificationAsRead(notificationId: number, currentUser: User) {
    const notification = await this.notificationRepo.findOne({
      id: notificationId,
      user: currentUser,
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    if (notification.isRead) {
      return notification;
    }

    notification.isRead = true;
    notification.readAt = new Date();

    await this.em.flush();

    return notification;
  }

  async markAllNotificationsAsRead(currentUser: User) {
    const notifications = await this.notificationRepo.find({
      user: currentUser,
      isRead: false,
    });

    notifications.forEach((notification) => {
      notification.isRead = true;
      notification.readAt = new Date();
    });

    await this.em.flush();

    return {
      message: `Marked ${notifications.length} notifications as read`,
      count: notifications.length,
    };
  }
}

import { Entity, Enum, ManyToOne, PrimaryKey, Property } from '@mikro-orm/core';
import { User } from 'src/users/entities/user.entity';
import { Task } from './task.entity';
import { TaskBid } from './task-bid.entity';

export enum NotificationType {
  NEW_BID = 'NEW_BID',
  COUNTER_OFFER_CLIENT = 'COUNTER_OFFER_CLIENT',
  COUNTER_OFFER_RUNNER = 'COUNTER_OFFER_RUNNER',
  BID_ACCEPTED = 'BID_ACCEPTED',
  BID_REJECTED = 'BID_REJECTED',
  TASK_ASSIGNED = 'TASK_ASSIGNED',
  TASK_STATUS_CHANGED = 'TASK_STATUS_CHANGED',
  DUE_DATE_REMINDER = 'DUE_DATE_REMINDER',
}

@Entity({ tableName: 'notifications' })
export class Notification {
  @PrimaryKey()
  id!: number;

  @ManyToOne(() => User)
  user!: User;

  @Enum(() => NotificationType)
  type!: NotificationType;

  @Property()
  title!: string;

  @Property()
  message!: string;

  @ManyToOne(() => Task, { nullable: true })
  task?: Task;

  @ManyToOne(() => TaskBid, { nullable: true })
  taskBid?: TaskBid;

  @Property()
  isRead: boolean = false;

  @Property({ onCreate: () => new Date() })
  createdAt?: Date;

  @Property({ nullable: true })
  readAt?: Date;
}

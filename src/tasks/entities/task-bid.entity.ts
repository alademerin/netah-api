import { Entity, Enum, Filter, ManyToOne, PrimaryKey, Property, Unique } from '@mikro-orm/core';
import { User } from 'src/users/entities/user.entity';
import { Task } from './task.entity';
import { TaskBidStatus } from '../dto/create-task-bid.dto';

@Entity()
@Filter({
  name: 'softDelete',
  cond: { deletedAt: null },
  default: true, // 👈 automatically applied to all queries
})
@Unique({ properties: ['task', 'createdBy'] }) // 🔒 one bid per user per task
export class TaskBid {
  @PrimaryKey()
  id!: number;

  @Property()
  amount!: number;

  @Property({ nullable: true })
  counterOffer?: number;

  @Property()
  message!: string;

  @Enum(() => TaskBidStatus)
  status: TaskBidStatus = TaskBidStatus.PENDING;

  @ManyToOne(() => User)
  createdBy!: User;

  @ManyToOne(() => Task)
  task!: Task;

  @Property({ onCreate: () => new Date() })
  createdAt?: Date;

  @Property({ nullable: true })
  deletedAt?: Date;
}

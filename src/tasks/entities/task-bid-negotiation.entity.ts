import { Entity, ManyToOne, PrimaryKey, Property, Enum } from '@mikro-orm/core';
import { TaskBid } from './task-bid.entity';
import { User } from 'src/users/entities/user.entity';

export enum NegotiationRole {
  CLIENT = 'CLIENT',
  RUNNER = 'RUNNER',
}

@Entity({ tableName: 'task_bid_negotiations' })
export class TaskBidNegotiation {
  @PrimaryKey()
  id!: number;

  @ManyToOne(() => TaskBid)
  taskBid!: TaskBid;

  @Property({ columnType: 'decimal(10,2)' })
  amount!: number;

  @Property({ nullable: true })
  message?: string;

  @ManyToOne(() => User)
  createdBy!: User;

  @Enum(() => NegotiationRole)
  role!: NegotiationRole;

  @Property({ onCreate: () => new Date() })
  createdAt?: Date;
}

import { Entity, Enum, ManyToOne, PrimaryKey, Property } from '@mikro-orm/core';
import { TaskBid } from './task-bid.entity';
import { User } from 'src/users/entities/user.entity';

export enum PaymentStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

@Entity({ tableName: 'payments' })
export class Payment {
  @PrimaryKey()
  id!: number;

  @ManyToOne(() => TaskBid)
  taskBid!: TaskBid;

  @ManyToOne(() => User)
  paidBy!: User;

  @Property({ columnType: 'decimal(10,2)' })
  bidAmount!: number;

  @Property({ columnType: 'decimal(10,2)' })
  serviceCharge!: number;

  @Property({ columnType: 'decimal(10,2)' })
  totalAmount!: number;

  @Property()
  paymentReference!: string;

  @Enum(() => PaymentStatus)
  status: PaymentStatus = PaymentStatus.PENDING;

  @Property({ onCreate: () => new Date() })
  createdAt?: Date;

  @Property({ nullable: true })
  completedAt?: Date;
}

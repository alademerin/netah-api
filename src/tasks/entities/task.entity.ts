import {
  Collection,
  Entity,
  Enum,
  Filter,
  ManyToOne,
  OneToMany,
  Opt,
  PrimaryKey,
  Property,
} from '@mikro-orm/core';
import { TaskStatusEnum, TaskUrgencyEnum } from '../dto/create-task.dto';
import { TaskCategory } from './task-category.entity';
import { User } from 'src/users/entities/user.entity';
import { Exclude } from 'class-transformer';
import { v4 as uuidv4 } from 'uuid';
import { TaskBid } from './task-bid.entity';

@Entity()
@Filter({
  name: 'softDelete',
  cond: { deletedAt: null },
  default: true,
})
export class Task {
  @PrimaryKey()
  @Exclude()
  id: number;

  @Property()
  title!: string;

  @Property({ type: 'uuid', unique: true, index: true })
  publicId?: string = uuidv4();

  @Property()
  description: string;

  @Property()
  location!: string;

  @Property()
  reward!: number;

  @Enum(() => TaskUrgencyEnum)
  urgency!: TaskUrgencyEnum;

  @Enum(() => TaskStatusEnum)
  status: TaskStatusEnum = TaskStatusEnum.OPEN;

  @Property({ default: 0 })
bidsCount: number & Opt = 0;

  @Property({ type: 'json', nullable: true })
  requirements?: string[];

  @Property({ type: 'json', default: [] })
  photos?: string[];

  @ManyToOne(() => TaskCategory)
  category!: TaskCategory;

  @ManyToOne(() => User)
  postedBy!: User;

  @ManyToOne(() => User, { nullable: true })
  assignedTo?: User;

  @Property({ onCreate: () => new Date() })
  createdAt?: Date;

  @Property({ nullable: true })
  deletedAt?: Date;

}

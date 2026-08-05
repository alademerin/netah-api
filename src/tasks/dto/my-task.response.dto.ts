import { TaskStatusEnum, TaskUrgencyEnum } from './create-task.dto';

export class MyTaskResponseDto {
  id!: number;
  publicId!: string;
  title!: string;
  description!: string;
  location!: string;
  reward!: number;
  urgency!: TaskUrgencyEnum;
  status!: TaskStatusEnum;
  bidCount!: number;
  hasReviewed!: boolean;
  createdAt?: Date;
}

import { TaskStatusEnum } from './create-task.dto';
import { LocationDto } from './location.dto';

export class MyTaskResponseDto {
  id!: number;
  publicId!: string;
  title!: string;
  description!: string;
  location!: LocationDto;
  reward!: number;
  deadline!: Date;
  status!: TaskStatusEnum;
  bidCount!: number;
  hasReviewed!: boolean;
  createdAt?: Date;
}

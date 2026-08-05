import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  MinLength,
  IsNumber,
  IsEnum,
  IsArray,
  IsOptional,
  Min,
} from 'class-validator';

export enum TaskUrgencyEnum {
  ASAP = 'ASAP',
  FLEXIBLE = 'FLEXIBLE',
  TODAY = 'TODAY',
}

export enum TaskStatusEnum {
  OPEN = 'OPEN',
  AWAITING_PAYMENT = 'AWAITING_PAYMENT',
  IN_PROGRESS = 'IN_PROGRESS',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  DISPUTED = 'DISPUTED',
  COMPLETED = 'COMPLETED',
}

export class CreateTaskDto {
  @ApiProperty({
    example: 'Pick up groceries from Shoprite',
    description: 'Title of the task',
  })
  @IsString()
  @IsNotEmpty({ message: 'Task name is required' })
  title!: string;

  @ApiProperty({
    example: 'Go to Market Square in Barnawa and pick up the package for me',
    description: 'Explains the task in detail',
  })
  @IsString()
  @IsNotEmpty({ message: 'Description name is required' })
  @MinLength(20, { message: 'Password must be at least 6 characters' })
  description!: string;

  @ApiProperty({
    example: 'Lekki Phase 1',
    description: 'Where the user would fulfilt the task',
  })
  @IsString()
  location!: string;

  @ApiProperty({
    example: 10000,
    description: 'How much the runner would earn from finishing the task',
  })
  @IsNumber()
  @IsNotEmpty()
  @Min(500, { message: 'Reward must be at least 500' })
  reward!: number;

  @ApiProperty({
    example: 'Grocery Shopping',
    description: 'Which category does this task belong to',
  })
  @IsNumber()
  @IsNotEmpty()
  categoryId!: number;

  @ApiProperty({
    example: 'ASAP',
    description: 'How quickly do you want the task to be completed',
    required: false,
  })
  @IsEnum(TaskUrgencyEnum, { message: 'Must be a valid enum' })
  urgency?: TaskUrgencyEnum;

  @ApiProperty({
    example: 'ASAP',
    description: 'How quickly do you want the task to be completed',
    required: false,
  })
  @IsEnum(TaskStatusEnum, { message: 'Must be a valid enum' })
  status: TaskStatusEnum = TaskStatusEnum.OPEN;

  @ApiProperty({
    example: ['Must be 18 years old'],
    description: 'Requirements of the task',
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  requirements?: string[];

  @ApiProperty({
    example: [''],
    description: 'Visual aids for the task runner',
    required: false,
  })
  @IsOptional()
  @IsArray({})
  @IsString({ each: true })
  photos?: string[];
}

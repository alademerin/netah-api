import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class DisputeTaskDto {
  @ApiProperty({
    example: 'Task was not completed as specified in the requirements.',
    description: 'Reason for the dispute',
  })
  @IsString()
  @IsNotEmpty({ message: 'Dispute reason is required' })
  @MinLength(10, { message: 'Dispute reason must be at least 10 characters' })
  reason!: string;
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class ApproveTaskDto {
  @ApiProperty({
    example: 5,
    description: 'Rating for the runner (1-5)',
  })
  @IsNumber()
  @IsNotEmpty({ message: 'Rating is required' })
  @Min(1, { message: 'Rating must be at least 1' })
  @Max(5, { message: 'Rating cannot exceed 5' })
  rating!: number;

  @ApiPropertyOptional({
    example: 'Great work! Very professional.',
    description: 'Optional feedback for the runner',
  })
  @IsOptional()
  @IsString()
  feedback?: string;
}

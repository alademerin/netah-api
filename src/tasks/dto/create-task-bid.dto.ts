import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

export enum TaskBidStatus {
  PENDING = 'PENDING',
  COUNTERED_BY_CLIENT = 'COUNTERED_BY_CLIENT',
  COUNTERED_BY_RUNNER = 'COUNTERED_BY_RUNNER',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
}

export class CreateTaskBidDto {
  @ApiProperty({
    example: 9000,
    description: 'Task Big Amount',
  })
  @IsNumber()
  @IsNotEmpty({ message: 'Bid amount is required' })
  @Min(500, { message: 'Bid amount must be at least 500' })
  amount!: number;

  @ApiProperty({
    example: 'Description',
    description: 'Why are you the right person for the job',
  })
  @IsString()
  message!: string;
}

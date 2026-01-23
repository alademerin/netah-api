import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export enum TaskBidStatus {
  PENDING = 'PENDING',
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
  amount!: number;

  @ApiProperty({
    example: 'Description',
    description: 'Why are you the right person for the job',
  })
  @IsString()
  message!: string;
}

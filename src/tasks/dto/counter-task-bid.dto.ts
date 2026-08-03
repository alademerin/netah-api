import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CounterTaskBidDto {
  @ApiProperty({
    example: 8500,
    description: 'Counter offer amount',
  })
  @IsNumber()
  @IsNotEmpty({ message: 'Counter amount is required' })
  amount!: number;

  @ApiPropertyOptional({
    example: 'Can you do this for 8500?',
    description: 'Optional negotiation message',
  })
  @IsOptional()
  @IsString()
  message?: string;
}

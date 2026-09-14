import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsString,
  IsOptional,
  IsIn,
} from 'class-validator';

export class LocationDto {
  @ApiProperty({
    example: 6.5244,
    description: 'Latitude coordinate',
  })
  @IsNumber()
  @IsNotEmpty()
  latitude!: number;

  @ApiProperty({
    example: 3.3792,
    description: 'Longitude coordinate',
  })
  @IsNumber()
  @IsNotEmpty()
  longitude!: number;

  @ApiProperty({
    example: 12.5,
    description: 'Accuracy in meters',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  accuracy_m?: number;

  @ApiProperty({
    example: 'gps',
    description: 'Source of location data',
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsIn(['gps', 'network', 'manual'])
  source?: string;

  @ApiProperty({
    example: 'Behind Total filling station, opposite GTB',
    description: 'Human-readable landmark description',
    required: false,
  })
  @IsOptional()
  @IsString()
  landmark?: string;
}

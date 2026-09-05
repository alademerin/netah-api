import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  IsOptional,
  Matches,
} from 'class-validator';

export class UpdateProfileDto {
  @ApiProperty({
    example: 'John',
    description: 'First name',
    required: false,
  })
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiProperty({
    example: 'Doe',
    description: 'Last name',
    required: false,
  })
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiProperty({
    example: 'john@example.com',
    description: 'User email address',
    required: false,
  })
  @IsEmail({}, { message: 'Invalid email address' })
  @IsOptional()
  email?: string;

  @ApiProperty({
    example: '+2348012345678',
    description: 'Phone number in E.164 format',
    required: false,
  })
  @IsString()
  @IsOptional()
  @Matches(/^\+?\d{10,15}$/, { message: 'Invalid phone number' })
  phoneNumber?: string;

  @ApiProperty({
    example: '123 Main St, Lagos, Nigeria',
    description: 'User address',
    required: false,
  })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiProperty({
    example: 'Lagos',
    description: 'User city',
    required: false,
  })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiProperty({
    example: 'I am a professional runner with 5 years of experience',
    description: 'User bio',
    required: false,
  })
  @IsString()
  @IsOptional()
  bio?: string;
}

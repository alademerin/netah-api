import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateAdminDto {
  @ApiProperty({
    example: 'admin@netah.com',
    description: 'Admin email address',
  })
  @IsEmail({}, { message: 'Invalid email address' })
  email!: string;

  @ApiProperty({ example: 'John', description: 'First name' })
  @IsString()
  @IsNotEmpty({ message: 'First name is required' })
  firstName!: string;

  @ApiProperty({ example: 'Doe', description: 'Last name' })
  @IsString()
  @IsNotEmpty({ message: 'Last name is required' })
  lastName!: string;

  @ApiProperty({
    example: '+2348012345678',
    description: 'Phone number',
  })
  @IsString()
  @IsNotEmpty({ message: 'Phone number is required' })
  phoneNumber!: string;

  @ApiProperty({ example: 'SecureAdminPass123', description: 'Admin password' })
  @IsString()
  @IsNotEmpty()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  password!: string;
}

import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';

export class AdminLogin2FADto {
  @ApiProperty({
    example: 'admin@netah.com',
    description: 'Admin email address',
  })
  @IsEmail({}, { message: 'Invalid email address' })
  email!: string;

  @ApiProperty({ example: 'SecureAdminPass123', description: 'Admin password' })
  @IsString()
  @IsNotEmpty()
  password!: string;

  @ApiProperty({
    example: '123456',
    description: '6-digit 2FA code (required if 2FA enabled)',
    required: false
  })
  @IsString()
  @IsOptional()
  @Length(6, 6, { message: '2FA code must be exactly 6 digits' })
  twoFactorCode?: string;
}

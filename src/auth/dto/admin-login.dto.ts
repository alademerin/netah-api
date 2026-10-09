import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class AdminLoginDto {
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
}

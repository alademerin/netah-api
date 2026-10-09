import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length } from 'class-validator';

export class Verify2FADto {
  @ApiProperty({ example: '123456', description: '6-digit 2FA code' })
  @IsString()
  @IsNotEmpty()
  @Length(6, 6, { message: '2FA code must be exactly 6 digits' })
  code!: string;
}

import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length } from 'class-validator';

export class Verify2FALoginDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'Pending token received from login response'
  })
  @IsString()
  @IsNotEmpty()
  pendingToken!: string;

  @ApiProperty({ example: '123456', description: '6-digit 2FA code from authenticator app' })
  @IsString()
  @IsNotEmpty()
  @Length(6, 6, { message: '2FA code must be exactly 6 digits' })
  code!: string;
}

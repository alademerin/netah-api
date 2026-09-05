import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateProfileVisibilityDto {
  @ApiProperty({
    example: true,
    description: 'Display your city on your profile',
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  showLocation?: boolean;

  @ApiProperty({
    example: true,
    description: 'Display your rating publicly',
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  showRating?: boolean;

  @ApiProperty({
    example: true,
    description: 'Display how many tasks you have completed',
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  showCompletedTasksCount?: boolean;

  @ApiProperty({
    example: true,
    description: 'Let other users message you directly',
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  allowDirectMessages?: boolean;
}

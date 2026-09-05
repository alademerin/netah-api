import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateNotificationPreferencesDto {
  // Notification Channels
  @ApiProperty({
    example: true,
    description: 'Receive notifications via email',
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  emailNotifications?: boolean;

  @ApiProperty({
    example: true,
    description: 'Receive push notifications in browser',
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  pushNotifications?: boolean;

  @ApiProperty({
    example: false,
    description: 'Receive text messages for important updates',
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  smsNotifications?: boolean;

  // Notification Preferences
  @ApiProperty({
    example: true,
    description: 'Notify when someone bids on your posted task',
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  notifyNewBids?: boolean;

  @ApiProperty({
    example: true,
    description: 'Notify on status changes and task activity',
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  notifyTaskUpdates?: boolean;

  @ApiProperty({
    example: true,
    description: 'Notify on payment received and escrow updates',
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  notifyPaymentAlerts?: boolean;

  @ApiProperty({
    example: false,
    description: 'Receive weekly summary of your activity',
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  notifyWeeklyDigest?: boolean;

  @ApiProperty({
    example: true,
    description: 'Receive special offers and platform tips',
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  notifyPromotions?: boolean;
}

import { Controller, Get, Param, UseGuards, Patch, Body, Post } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { ResponseMessage } from 'src/response/response.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/auth/decorators/current-user-decorator';
import { User } from 'src/users/entities/user.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateNotificationPreferencesDto } from './dto/update-notification-preferences.dto';
import { UpdateProfileVisibilityDto } from './dto/update-profile-visibility.dto';

@Controller('profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @UseGuards(JwtAuthGuard)
  @ResponseMessage('Profile retrieved successfully!')
  @Get('me')
  getProfile(@CurrentUser() currentUser: User) {
    return this.profileService.getProfile(currentUser.id);
  }

  @UseGuards(JwtAuthGuard)
  @ResponseMessage('Profile updated successfully!')
  @Patch('me')
  updateProfile(
    @CurrentUser() currentUser: User,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    return this.profileService.updateProfile(currentUser.id, updateProfileDto);
  }

  @UseGuards(JwtAuthGuard)
  @ResponseMessage('Password changed successfully!')
  @Post('me/change-password')
  changePassword(
    @CurrentUser() currentUser: User,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    return this.profileService.changePassword(currentUser.id, changePasswordDto);
  }

  @UseGuards(JwtAuthGuard)
  @ResponseMessage('Notification preferences retrieved successfully!')
  @Get('me/notification-preferences')
  getNotificationPreferences(@CurrentUser() currentUser: User) {
    return this.profileService.getNotificationPreferences(currentUser.id);
  }

  @UseGuards(JwtAuthGuard)
  @ResponseMessage('Notification preferences updated successfully!')
  @Patch('me/notification-preferences')
  updateNotificationPreferences(
    @CurrentUser() currentUser: User,
    @Body() updateDto: UpdateNotificationPreferencesDto,
  ) {
    return this.profileService.updateNotificationPreferences(currentUser.id, updateDto);
  }

  @UseGuards(JwtAuthGuard)
  @ResponseMessage('Profile visibility settings retrieved successfully!')
  @Get('me/visibility')
  getProfileVisibility(@CurrentUser() currentUser: User) {
    return this.profileService.getProfileVisibility(currentUser.id);
  }

  @UseGuards(JwtAuthGuard)
  @ResponseMessage('Profile visibility settings updated successfully!')
  @Patch('me/visibility')
  updateProfileVisibility(
    @CurrentUser() currentUser: User,
    @Body() updateDto: UpdateProfileVisibilityDto,
  ) {
    return this.profileService.updateProfileVisibility(currentUser.id, updateDto);
  }

  @UseGuards(JwtAuthGuard)
  @ResponseMessage('Dashboard summary retrieved successfully!')
  @Get('dashboard')
  getDashboardSummary(@CurrentUser() currentUser: User) {
    return this.profileService.getDashboardSummary(currentUser.id);
  }

  @UseGuards(JwtAuthGuard)
  @ResponseMessage('Public profile retrieved successfully!')
  @Get(':uuid')
  getPublicProfile(@Param('uuid') uuid: string) {
    return this.profileService.getPublicProfile(uuid);
  }

  @UseGuards(JwtAuthGuard)
  @ResponseMessage('User reviews retrieved successfully!')
  @Get(':uuid/reviews')
  getUserReviews(@Param('uuid') uuid: string) {
    return this.profileService.getUserReviews(uuid);
  }
}

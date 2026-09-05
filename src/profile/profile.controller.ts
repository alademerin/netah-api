import { Controller, Get, Param, UseGuards, Patch, Body } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { ResponseMessage } from 'src/response/response.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/auth/decorators/current-user-decorator';
import { User } from 'src/users/entities/user.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';

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
  @ResponseMessage('Dashboard summary retrieved successfully!')
  @Get('dashboard')
  getDashboardSummary(@CurrentUser() currentUser: User) {
    return this.profileService.getDashboardSummary(currentUser.id);
  }

  @UseGuards(JwtAuthGuard)
  @ResponseMessage('User reviews retrieved successfully!')
  @Get(':userId/reviews')
  getUserReviews(@Param('userId') userId: string) {
    return this.profileService.getUserReviews(+userId);
  }
}

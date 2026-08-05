import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { ResponseMessage } from 'src/response/response.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/auth/decorators/current-user-decorator';
import { User } from 'src/users/entities/user.entity';

@Controller('profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

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

import { Controller, Get, Patch, Param, UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { ResponseMessage } from 'src/response/response.decorator';
import { CurrentUser } from 'src/auth/decorators/current-user-decorator';
import { User } from 'src/users/entities/user.entity';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @UseGuards(JwtAuthGuard)
  @ResponseMessage('Notifications retrieved successfully!')
  @Get()
  getNotifications(@CurrentUser() currentUser: User) {
    return this.notificationsService.getNotifications(currentUser);
  }

  @UseGuards(JwtAuthGuard)
  @ResponseMessage('Notification marked as read successfully!')
  @Patch(':id/read')
  markNotificationAsRead(@Param('id') id: string, @CurrentUser() currentUser: User) {
    return this.notificationsService.markNotificationAsRead(+id, currentUser);
  }

  @UseGuards(JwtAuthGuard)
  @ResponseMessage('All notifications marked as read successfully!')
  @Patch('read-all')
  markAllNotificationsAsRead(@CurrentUser() currentUser: User) {
    return this.notificationsService.markAllNotificationsAsRead(currentUser);
  }
}

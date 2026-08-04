import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Notification } from 'src/tasks/entities/notification.entity';
import { User } from 'src/users/entities/user.entity';

@Module({
  imports: [MikroOrmModule.forFeature([Notification, User])],
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}

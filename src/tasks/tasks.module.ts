import { Module } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { TaskCategory } from './entities/task-category.entity';
import { Task } from './entities/task.entity';
import { User } from 'src/users/entities/user.entity';
import { TaskBid } from './entities/task-bid.entity';
import { TaskBidNegotiation } from './entities/task-bid-negotiation.entity';
import { Payment } from './entities/payment.entity';
import { SystemSettings } from './entities/system-settings.entity';
import { NotificationsModule } from 'src/notifications/notifications.module';
import { CloudinaryModule } from 'src/cloudinary/cloudinary.module';
import { PaystackService } from './paystack.service';

@Module({
  imports: [
    MikroOrmModule.forFeature([TaskCategory, Task, TaskBid, TaskBidNegotiation, Payment, SystemSettings, User]),
    NotificationsModule,
    CloudinaryModule,
  ],
  controllers: [TasksController],
  providers: [TasksService, PaystackService],
})
export class TasksModule {}

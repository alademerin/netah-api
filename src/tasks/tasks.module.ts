import { Module } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { TaskCategory } from './entities/task-category.entity';
import { Task } from './entities/task.entity';
import { User } from 'src/users/entities/user.entity';
import { TaskBid } from './entities/task-bid.entity';

@Module({
  imports: [MikroOrmModule.forFeature([TaskCategory, Task, TaskBid, User])],
  controllers: [TasksController],
  providers: [TasksService],
})
export class TasksModule {}

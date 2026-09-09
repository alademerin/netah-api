import { Module } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { ProfileController } from './profile.controller';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { User } from 'src/users/entities/user.entity';
import { Task } from 'src/tasks/entities/task.entity';
import { Payment } from 'src/tasks/entities/payment.entity';
import { CloudinaryModule } from 'src/cloudinary/cloudinary.module';

@Module({
  imports: [MikroOrmModule.forFeature([User, Task, Payment]), CloudinaryModule],
  controllers: [ProfileController],
  providers: [ProfileService],
})
export class ProfileModule {}

import {
  Controller,
  Get,
  Param,
  UseGuards,
  Delete,
  Patch,
  Body,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { ResponseMessage } from 'src/response/response.decorator';
import { AdminJwtAuthGuard } from 'src/auth/guards/admin-jwt-auth.guard';
import { MustChangePasswordGuard } from 'src/auth/guards/must-change-password.guard';
import { UpdateUserDto } from './dto/update-user.dto';

@UseGuards(AdminJwtAuthGuard, MustChangePasswordGuard)
@Controller('admin/users')
export class AdminUsersController {
  constructor(private readonly usersService: UsersService) {}

  @ResponseMessage('All users retrieved successfully!')
  @Get()
  findAllUsers() {
    return this.usersService.adminFindAllUsers();
  }

  @ResponseMessage('User retrieved successfully!')
  @Get(':id')
  findUserById(@Param('id') id: string) {
    return this.usersService.findOne(+id);
  }

  @ResponseMessage('User updated successfully!')
  @Patch(':id')
  updateUser(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(+id, updateUserDto);
  }

  @ResponseMessage('User deleted successfully!')
  @Delete(':id')
  deleteUser(@Param('id') id: string) {
    return this.usersService.remove(+id);
  }

  @ResponseMessage('User statistics retrieved successfully!')
  @Get('stats/overview')
  getUserStats() {
    return this.usersService.adminGetUserStats();
  }

  @ResponseMessage('User tasks retrieved successfully!')
  @Get(':id/tasks')
  getUserTasks(@Param('id') id: string) {
    return this.usersService.adminGetUserTasks(+id);
  }
}

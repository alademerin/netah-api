import {
  Controller,
  Get,
  Param,
  UseGuards,
  Delete,
  Patch,
  Body,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { ResponseMessage } from 'src/response/response.decorator';
import { AdminJwtAuthGuard } from 'src/auth/guards/admin-jwt-auth.guard';
import { MustChangePasswordGuard } from 'src/auth/guards/must-change-password.guard';
import { UpdateTaskDto } from './dto/update-task.dto';

@UseGuards(AdminJwtAuthGuard, MustChangePasswordGuard)
@Controller('admin/tasks')
export class AdminTasksController {
  constructor(private readonly tasksService: TasksService) {}

  @ResponseMessage('All tasks retrieved successfully!')
  @Get()
  findAllTasks() {
    return this.tasksService.adminFindAllTasks();
  }

  @ResponseMessage('Task retrieved successfully!')
  @Get(':id')
  findTaskById(@Param('id') id: string) {
    return this.tasksService.adminFindTaskById(id);
  }

  @ResponseMessage('Task bids retrieved successfully!')
  @Get(':id/bids')
  getTaskBids(@Param('id') id: string) {
    return this.tasksService.adminGetTaskBids(id);
  }

  @ResponseMessage('Task updated successfully!')
  @Patch(':id')
  updateTask(@Param('id') id: string, @Body() updateTaskDto: UpdateTaskDto) {
    return this.tasksService.adminUpdateTask(id, updateTaskDto);
  }

  @ResponseMessage('Task deleted successfully!')
  @Delete(':id')
  deleteTask(@Param('id') id: string) {
    return this.tasksService.adminDeleteTask(id);
  }

  @ResponseMessage('Task statistics retrieved successfully!')
  @Get('stats/overview')
  getTaskStats() {
    return this.tasksService.adminGetTaskStats();
  }
}

import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { CreateTaskCategoryDto } from './dto/create-task-category.dto';
import { ResponseMessage } from 'src/response/response.decorator';
import { CurrentUser } from 'src/auth/decorators/current-user-decorator';
import { User } from 'src/users/entities/user.entity';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CreateTaskBidDto } from './dto/create-task-bid.dto';

@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @ResponseMessage('Task posted successfully!')
  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() createTaskDto: CreateTaskDto, @CurrentUser() currentUser: User) {
    return this.tasksService.create(createTaskDto, currentUser);
  }

  @Get()
  findAll() {
    return this.tasksService.findAll();
  }

  @ResponseMessage('Task category retrieved successfully!')
  @Get('category')
  finaAllCategories() {
    return this.tasksService.findAllCategories();
  }

  @Delete('category/:id')
  removeCategory(@Param('id') id: string) {
    return this.tasksService.remove(+id);
  }

  @Get(':id')
  findOneByUuid(@Param('id') id: string, @CurrentUser() currentUser: User) {
    return this.tasksService.findOneByUuid(id, currentUser);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTaskDto: UpdateTaskDto) {
    return this.tasksService.update(+id, updateTaskDto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.tasksService.remove(+id);
  }

  @UseGuards(JwtAuthGuard)
  @ResponseMessage('Task category created successfully!')
  @Post('category')
  createCategory(@Body() createTaskCategoryDto: CreateTaskCategoryDto) {
    return this.tasksService.createCategory(createTaskCategoryDto);
  }

  @UseGuards(JwtAuthGuard)
  @ResponseMessage('Task bid sent successfully')
  @Post(':id/bids')
  createBid(
    @Param('id') id: string,
    @Body() createTaskBidDto: CreateTaskBidDto,
    @CurrentUser() currentUser: User,
  ) {
    return this.tasksService.createBid(id, createTaskBidDto, currentUser);
  }
}

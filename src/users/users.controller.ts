import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ResponseMessage } from 'src/response/response.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

  @UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  //private readonly logger = new Logger(UsersController.name);

  @Post()
  @ResponseMessage('User created successfully!')
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @ResponseMessage('Users retrieved successfully!')
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  @ResponseMessage('User retrieved successfully!')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(+id, updateUserDto);
  }

  @Delete(':id')
  @ResponseMessage('User deleted successfully!')
  remove(@Param('id') id: string) {
    return this.usersService.remove(+id);
  }
}

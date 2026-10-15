import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Res,
  ConflictException,
} from '@nestjs/common';
import { AdminsService } from './admins.service';
import { CreateAdminDto } from './dto/create-admin.dto';
import { ResponseMessage } from 'src/response/response.decorator';
import { AdminJwtAuthGuard } from 'src/auth/guards/admin-jwt-auth.guard';
import { MustChangePasswordGuard } from 'src/auth/guards/must-change-password.guard';
import { Must2FAGuard } from 'src/auth/guards/must-2fa.guard';
import { Response } from 'express';
import { EmailService } from 'src/email/email.service';

@UseGuards(AdminJwtAuthGuard, MustChangePasswordGuard, Must2FAGuard)
@Controller('admin/admins')
export class AdminsController {
  constructor(
    private readonly adminsService: AdminsService,
    private readonly emailService: EmailService,
  ) {}

  @ResponseMessage('Admin created successfully!')
  @Post()
  async create(
    @Body() createAdminDto: CreateAdminDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const existingEmail = await this.adminsService.findOneByEmailWithPassword(createAdminDto.email);
    const existingPhone = await this.adminsService.findOneByPhoneNumber(createAdminDto.phoneNumber);

    if (existingEmail || existingPhone) {
      throw new ConflictException('Admin already exists. Please use a different email or phone number!');
    }

    const admin = await this.adminsService.create(createAdminDto);

    // Send welcome email with credentials
    await this.emailService.sendAdminCreatedEmail(
      admin.email,
      admin.firstName,
      admin.lastName,
      createAdminDto.password,
    );

    return {
      id: admin.id,
      email: admin.email,
      firstName: admin.firstName,
      lastName: admin.lastName,
      phoneNumber: admin.phoneNumber,
      mustChangePassword: admin.mustChangePassword,
    };
  }

  @ResponseMessage('All admins retrieved successfully!')
  @Get()
  findAll() {
    return this.adminsService.findAll();
  }

  @ResponseMessage('Admin retrieved successfully!')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.adminsService.findOne(+id);
  }

  @ResponseMessage('Admin updated successfully!')
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAdminDto: Partial<CreateAdminDto>) {
    return this.adminsService.update(+id, updateAdminDto);
  }

  @ResponseMessage('Admin deleted successfully!')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.adminsService.remove(+id);
  }
}

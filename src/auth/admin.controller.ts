import { Controller, Post, Body, Res, UseGuards, Put, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateAdminDto } from './dto/create-admin.dto';
import { AdminLoginDto } from './dto/admin-login.dto';
import { AdminLogin2FADto } from './dto/admin-login-2fa.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { Verify2FADto } from './dto/verify-2fa.dto';
import { ResponseMessage } from 'src/response/response.decorator';
import { Response } from 'express';
import { AdminJwtAuthGuard } from './guards/admin-jwt-auth.guard';
import { MustChangePasswordGuard } from './guards/must-change-password.guard';
import { CurrentUser } from './decorators/current-user-decorator';
import { User } from 'src/users/entities/user.entity';

@Controller('admin/auth')
export class AdminController {
  constructor(private readonly authService: AuthService) {}

  @ResponseMessage('Admin created successfully!')
  @UseGuards(AdminJwtAuthGuard, MustChangePasswordGuard)
  @Post('create')
  createAdmin(
    @Body() createAdminDto: CreateAdminDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.createAdmin(createAdminDto, res);
  }

  @ResponseMessage('Admin login successful!')
  @Post('login')
  adminLogin(
    @Body() adminLogin2FADto: AdminLogin2FADto,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.adminLogin2FA(adminLogin2FADto, res);
  }

  @ResponseMessage('Password changed successfully!')
  @UseGuards(AdminJwtAuthGuard)
  @Put('change-password')
  changePassword(
    @CurrentUser() user: User,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    return this.authService.changeAdminPassword(user, changePasswordDto);
  }

  @ResponseMessage('2FA secret generated successfully! Scan QR code with authenticator app.')
  @UseGuards(AdminJwtAuthGuard)
  @Post('2fa/generate')
  generate2FA(@CurrentUser() user: User) {
    return this.authService.generate2FASecret(user);
  }

  @ResponseMessage('2FA enabled successfully! You will need to enter code on next login.')
  @UseGuards(AdminJwtAuthGuard)
  @Post('2fa/enable')
  enable2FA(@CurrentUser() user: User, @Body() verify2FADto: Verify2FADto) {
    return this.authService.enable2FA(user, verify2FADto);
  }

  @ResponseMessage('2FA disabled successfully!')
  @UseGuards(AdminJwtAuthGuard)
  @Post('2fa/disable')
  disable2FA(@CurrentUser() user: User, @Body() verify2FADto: Verify2FADto) {
    return this.authService.disable2FA(user, verify2FADto);
  }
}

import { Controller, Post, Body, Res, UseGuards, Put } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AdminLoginDto } from './dto/admin-login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { Verify2FADto } from './dto/verify-2fa.dto';
import { Verify2FALoginDto } from './dto/verify-2fa-login.dto';
import { ResponseMessage } from 'src/response/response.decorator';
import { Response } from 'express';
import { AdminJwtAuthGuard } from './guards/admin-jwt-auth.guard';
import { Must2FAGuard } from './guards/must-2fa.guard';
import { CurrentUser } from './decorators/current-user-decorator';
import { Admin } from 'src/admins/entities/admin.entity';

@Controller('admin/auth')
export class AdminController {
  constructor(private readonly authService: AuthService) {}

  @ResponseMessage('Admin login successful!')
  @Post('login')
  adminLogin(
    @Body() adminLoginDto: AdminLoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.adminLogin2FA(adminLoginDto, res);
  }

  @ResponseMessage('2FA verification successful!')
  @Post('2fa/verify-login')
  verify2FALogin(
    @Body() verify2FALoginDto: Verify2FALoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.verify2FALogin(verify2FALoginDto.pendingToken, verify2FALoginDto.code, res);
  }

  @ResponseMessage('Password changed successfully!')
  @UseGuards(AdminJwtAuthGuard)
  @Put('change-password')
  changePassword(
    @CurrentUser() admin: Admin,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    return this.authService.changeAdminPassword(admin, changePasswordDto);
  }

  @ResponseMessage('2FA secret generated successfully! Scan QR code with authenticator app.')
  @UseGuards(AdminJwtAuthGuard)
  @Post('2fa/generate')
  generate2FA(@CurrentUser() admin: Admin) {
    return this.authService.generate2FASecret(admin);
  }

  @ResponseMessage('2FA enabled successfully! You will need to enter code on next login.')
  @UseGuards(AdminJwtAuthGuard)
  @Post('2fa/enable')
  enable2FA(@CurrentUser() admin: Admin, @Body() verify2FADto: Verify2FADto) {
    return this.authService.enable2FA(admin, verify2FADto);
  }

  @ResponseMessage('2FA disabled successfully!')
  @UseGuards(AdminJwtAuthGuard, Must2FAGuard)
  @Post('2fa/disable')
  disable2FA(@CurrentUser() admin: Admin, @Body() verify2FADto: Verify2FADto) {
    return this.authService.disable2FA(admin, verify2FADto);
  }
}

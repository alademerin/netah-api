import { BadRequestException, ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { CreateAuthDto } from './dto/create-auth.dto';
import { UsersService } from 'src/users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Response } from 'express';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { User } from 'src/users/entities/user.entity';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { EmailService } from 'src/email/email.service';
import { CreateAdminDto } from './dto/create-admin.dto';
import { AdminLoginDto } from './dto/admin-login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { AdminLogin2FADto } from './dto/admin-login-2fa.dto';
import { Verify2FADto } from './dto/verify-2fa.dto';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private emailService: EmailService,
  ) {}

  async login(createAuthDto: CreateAuthDto, res: Response) {
    const user = await this.usersService.findOneByEmailWithPassword(createAuthDto.email);
    if (!user) throw new UnauthorizedException('Invalid Credentials');

    const passwordMatch = await bcrypt.compare(createAuthDto.password, user.password);
    if (!passwordMatch) throw new UnauthorizedException('Invalid Credentials');

    const payload = {
      sub: user.id,
      email: user.email,
    };

    const token = this.jwtService.sign(payload);
    const isProd = process.env.NODE_ENV === 'production';

    res.cookie('access_token', token, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days
    });

    // Return token in body for mobile/incognito clients that can't persist cookies
    return { access_token: token };
  }

  async register(signupDto: CreateUserDto, res: Response) {
    const existingEmail = await this.usersService.findOneByEmailWithPassword(signupDto.email);
    const existingPhone = await this.usersService.findOneByPhoneNumber(signupDto.phoneNumber);

    if (existingEmail || existingPhone)
      throw new ConflictException(
        'User already exists. Please use a different email or phone number!',
      );

    const user = await this.usersService.create(signupDto);

    const payload = {
      sub: user.id,
      email: user.email,
    };

    const token = this.jwtService.sign(payload);
    const isProd = process.env.NODE_ENV === 'production';

    res.cookie('access_token', token, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days
    });

    // Return token in body for mobile/incognito clients that can't persist cookies
    return { access_token: token };
  }

  async getMe(user: User) {
    const authenticatedUser = await this.usersService.findOne(user?.id);
    return authenticatedUser;
  }

  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const user = await this.usersService.findOneByEmailWithPassword(forgotPasswordDto.email);

    // Always return success message to prevent email enumeration
    if (!user) {
      return { message: 'If an account exists with this email, you will receive a password reset code' };
    }

    const otp = this.generateOtp();
    const expiryTime = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    user.passwordResetOtp = otp;
    user.passwordResetOtpExpiry = expiryTime;
    await this.usersService.update(user.id, user);

    await this.emailService.sendPasswordResetOtp(user.email, otp, user.firstName);

    return { message: 'If an account exists with this email, you will receive a password reset code' };
  }

  async verifyOtp(verifyOtpDto: VerifyOtpDto) {
    const user = await this.usersService.findOneByEmailWithPassword(verifyOtpDto.email);
    if (!user) {
      throw new BadRequestException('User with this email does not exist');
    }

    if (!user.passwordResetOtp || !user.passwordResetOtpExpiry) {
      throw new BadRequestException('No OTP request found for this user');
    }

    if (user.passwordResetOtp !== verifyOtpDto.otp) {
      throw new BadRequestException('Invalid OTP');
    }

    if (new Date() > user.passwordResetOtpExpiry) {
      throw new BadRequestException('OTP has expired');
    }

    return { message: 'OTP verified successfully' };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const user = await this.usersService.findOneByEmailWithPassword(resetPasswordDto.email);
    if (!user) {
      throw new BadRequestException('User with this email does not exist');
    }

    if (!user.passwordResetOtp || !user.passwordResetOtpExpiry) {
      throw new BadRequestException('No OTP request found for this user');
    }

    if (user.passwordResetOtp !== resetPasswordDto.otp) {
      throw new BadRequestException('Invalid OTP');
    }

    if (new Date() > user.passwordResetOtpExpiry) {
      throw new BadRequestException('OTP has expired');
    }

    user.password = resetPasswordDto.newPassword;
    user.passwordResetOtp = undefined;
    user.passwordResetOtpExpiry = undefined;
    await this.usersService.update(user.id, user);

    return { message: 'Password reset successful' };
  }

  async createAdmin(createAdminDto: CreateAdminDto, res: Response) {
    const existingEmail = await this.usersService.findOneByEmailWithPassword(createAdminDto.email);
    const existingPhone = await this.usersService.findOneByPhoneNumber(createAdminDto.phoneNumber);

    if (existingEmail || existingPhone)
      throw new ConflictException(
        'Admin already exists. Please use a different email or phone number!',
      );

    const adminData = {
      ...createAdminDto,
      role: 'admin' as 'admin',
      registeredAs: 'admin',
      mustChangePassword: true,
    };

    const admin = await this.usersService.create(adminData);

    const payload = {
      sub: admin.id,
      email: admin.email,
    };

    const token = this.jwtService.sign(payload);
    const isProd = process.env.NODE_ENV === 'production';

    res.cookie('admin_token', token, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days
    });

    return { access_token: token };
  }

  async adminLogin(adminLoginDto: AdminLoginDto, res: Response) {
    const admin = await this.usersService.findOneByEmailWithPassword(adminLoginDto.email);

    if (!admin || admin.role !== 'admin') {
      throw new UnauthorizedException('Invalid Credentials');
    }

    const passwordMatch = await bcrypt.compare(adminLoginDto.password, admin.password);
    if (!passwordMatch) throw new UnauthorizedException('Invalid Credentials');

    const payload = {
      sub: admin.id,
      email: admin.email,
    };

    const token = this.jwtService.sign(payload);
    const isProd = process.env.NODE_ENV === 'production';

    res.cookie('admin_token', token, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days
    });

    return {
      access_token: token,
      mustChangePassword: admin.mustChangePassword || false,
    };
  }

  async changeAdminPassword(user: User, changePasswordDto: ChangePasswordDto) {
    const admin = await this.usersService.findOneByEmailWithPassword(user.email);

    if (!admin || admin.role !== 'admin') {
      throw new UnauthorizedException('Admin access required');
    }

    const passwordMatch = await bcrypt.compare(changePasswordDto.currentPassword, admin.password);
    if (!passwordMatch) {
      throw new BadRequestException('Current password is incorrect');
    }

    admin.password = changePasswordDto.newPassword;
    admin.mustChangePassword = false;
    await this.usersService.update(admin.id, admin);

    return { message: 'Password changed successfully' };
  }

  async generate2FASecret(user: User) {
    const admin = await this.usersService.findOneByEmailWithPassword(user.email);

    if (!admin || admin.role !== 'admin') {
      throw new UnauthorizedException('Admin access required');
    }

    if (admin.mustChangePassword) {
      throw new BadRequestException('Please change your password before setting up 2FA');
    }

    const secret = speakeasy.generateSecret({
      name: `Netah Admin (${admin.email})`,
      length: 32,
    });

    // Store secret temporarily (not enabled yet)
    admin.twoFactorSecret = secret.base32;
    await this.usersService.update(admin.id, admin);

    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!);

    return {
      secret: secret.base32,
      qrCode: qrCodeUrl,
    };
  }

  async enable2FA(user: User, verify2FADto: Verify2FADto) {
    const admin = await this.usersService.findOneByEmailWithPassword(user.email);

    if (!admin || admin.role !== 'admin') {
      throw new UnauthorizedException('Admin access required');
    }

    if (admin.mustChangePassword) {
      throw new BadRequestException('Please change your password before setting up 2FA');
    }

    if (!admin.twoFactorSecret) {
      throw new BadRequestException('Please generate 2FA secret first');
    }

    // Verify the code
    const isValid = speakeasy.totp.verify({
      secret: admin.twoFactorSecret,
      encoding: 'base32',
      token: verify2FADto.code,
      window: 2,
    });

    if (!isValid) {
      throw new BadRequestException('Invalid 2FA code');
    }

    // Enable 2FA
    admin.twoFactorEnabled = true;
    await this.usersService.update(admin.id, admin);

    return { message: '2FA enabled successfully' };
  }

  async disable2FA(user: User, verify2FADto: Verify2FADto) {
    const admin = await this.usersService.findOneByEmailWithPassword(user.email);

    if (!admin || admin.role !== 'admin') {
      throw new UnauthorizedException('Admin access required');
    }

    if (!admin.twoFactorEnabled || !admin.twoFactorSecret) {
      throw new BadRequestException('2FA is not enabled');
    }

    // Verify the code before disabling
    const isValid = speakeasy.totp.verify({
      secret: admin.twoFactorSecret,
      encoding: 'base32',
      token: verify2FADto.code,
      window: 2,
    });

    if (!isValid) {
      throw new BadRequestException('Invalid 2FA code');
    }

    // Disable 2FA
    admin.twoFactorEnabled = false;
    admin.twoFactorSecret = undefined;
    await this.usersService.update(admin.id, admin);

    return { message: '2FA disabled successfully' };
  }

  async adminLogin2FA(adminLoginDto: AdminLoginDto, res: Response) {
    const admin = await this.usersService.findOneByEmailWithPassword(adminLoginDto.email);

    if (!admin || admin.role !== 'admin') {
      throw new UnauthorizedException('Invalid Credentials');
    }

    const passwordMatch = await bcrypt.compare(adminLoginDto.password, admin.password);
    if (!passwordMatch) throw new UnauthorizedException('Invalid Credentials');

    // Check if 2FA is enabled
    if (admin.twoFactorEnabled) {
      // Issue temporary pending token for 2FA verification
      const pendingPayload = {
        sub: admin.id,
        email: admin.email,
        pending2FA: true,
      };

      const pendingToken = this.jwtService.sign(pendingPayload, {
        expiresIn: '5m', // 5 minutes to complete 2FA
      });

      return {
        requires2FA: true,
        pendingToken,
        message: '2FA code required',
      };
    }

    const payload = {
      sub: admin.id,
      email: admin.email,
    };

    const token = this.jwtService.sign(payload);
    const isProd = process.env.NODE_ENV === 'production';

    res.cookie('admin_token', token, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days
    });

    return {
      access_token: token,
      mustChangePassword: admin.mustChangePassword || false,
      twoFactorEnabled: false,
    };
  }

  async verify2FALogin(pendingToken: string, code: string, res: Response) {
    // Verify pending token
    let payload: any;
    try {
      payload = this.jwtService.verify(pendingToken);
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired session. Please login again.');
    }

    if (!payload.pending2FA) {
      throw new UnauthorizedException('Invalid session token');
    }

    const admin = await this.usersService.findOneByEmailWithPassword(payload.email);

    if (!admin || admin.role !== 'admin' || !admin.twoFactorEnabled) {
      throw new UnauthorizedException('Invalid session');
    }

    // Verify 2FA code
    const isValid = speakeasy.totp.verify({
      secret: admin.twoFactorSecret!,
      encoding: 'base32',
      token: code,
      window: 2,
    });

    if (!isValid) {
      throw new UnauthorizedException('Invalid 2FA code');
    }

    // Issue real admin token
    const finalPayload = {
      sub: admin.id,
      email: admin.email,
    };

    const token = this.jwtService.sign(finalPayload);
    const isProd = process.env.NODE_ENV === 'production';

    res.cookie('admin_token', token, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days
    });

    return {
      access_token: token,
      mustChangePassword: admin.mustChangePassword || false,
      twoFactorEnabled: true,
    };
  }
}

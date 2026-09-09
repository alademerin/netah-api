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
      sameSite: 'lax',
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
    if (!user) {
      throw new BadRequestException('User with this email does not exist');
    }

    const otp = this.generateOtp();
    const expiryTime = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    user.passwordResetOtp = otp;
    user.passwordResetOtpExpiry = expiryTime;
    await this.usersService.update(user.id, user);

    await this.emailService.sendPasswordResetOtp(user.email, otp, user.firstName);

    return { message: 'OTP sent to your email' };
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
}

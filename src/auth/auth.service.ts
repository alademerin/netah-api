import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateAuthDto } from './dto/create-auth.dto';
import { UsersService } from 'src/users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Response } from 'express';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { User } from 'src/users/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async login(createAuthDto: CreateAuthDto, res: Response) {
    const user = await this.usersService.findOneByEmailWithPassword(
      createAuthDto.email,
    );
    if (!user) throw new UnauthorizedException('Invalid Credentials');

    const passwordMatch = await bcrypt.compare(
      createAuthDto.password,
      user.password,
    );
    if (!passwordMatch) throw new UnauthorizedException('Invalid Credentials');

    const payload = {
      sub: user.id,
      email: user.email,
    };

    const token = this.jwtService.sign(payload);
    const isProd = process.env.NODE_ENV === 'production';

    res.cookie('access_token', token, {
      httpOnly: false,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      maxAge: 1000 * 60 * 60 * 24 * 7,
    });
  }

  async register(signupDto: CreateUserDto, res: Response) {
    const existingEmail = await this.usersService.findOneByEmailWithPassword(
      signupDto.email,
    );
    const existingPhone = await this.usersService.findOneByPhoneNumber(
      signupDto.phoneNumber,
    );

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
      httpOnly: false,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      maxAge: 1000 * 60 * 60 * 24 * 7,
    });
  }

  async getMe(user: User) {
    const authenticatedUser = await this.usersService.findOne(user?.id);
    return authenticatedUser;
  }
}

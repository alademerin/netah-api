import { Controller, Post, Body, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateAuthDto } from './dto/create-auth.dto';
import { ResponseMessage } from 'src/response/response.decorator';
import { Response } from 'express';
import { CreateUserDto } from 'src/users/dto/create-user.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ResponseMessage('Login successful!')
  @Post('login')
  login(@Body() createAuthDto: CreateAuthDto, @Res({ passthrough: true }) res: Response) {
    return this.authService.login(createAuthDto, res);
  }

  @ResponseMessage('Sign up successful!')
  @Post('register')
  register(@Body() signUpDto: CreateUserDto, @Res({ passthrough: true }) res: Response) {
    return this.authService.register(signUpDto, res);
  }
}

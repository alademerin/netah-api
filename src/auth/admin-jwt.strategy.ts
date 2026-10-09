import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { adminCookieExtractor } from './utils/admin-cookie-extractor';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class AdminJwtStrategy extends PassportStrategy(Strategy, 'admin-jwt') {
  constructor(
    configService: ConfigService,
    private usersService: UsersService,
  ) {
    super({
      jwtFromRequest: adminCookieExtractor,
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    try {
      const user = await this.usersService.findOne(payload.sub);

      // Ensure user is admin
      if (!user || user.role !== 'admin') {
        throw new UnauthorizedException('Admin access required');
      }

      return user;
    } catch (error) {
      throw new UnauthorizedException('Invalid admin credentials');
    }
  }
}

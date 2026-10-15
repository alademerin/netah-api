import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { adminCookieExtractor } from './utils/admin-cookie-extractor';
import { AdminsService } from 'src/admins/admins.service';

@Injectable()
export class AdminJwtStrategy extends PassportStrategy(Strategy, 'admin-jwt') {
  constructor(
    configService: ConfigService,
    private adminsService: AdminsService,
  ) {
    super({
      jwtFromRequest: adminCookieExtractor,
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    try {
      const admin = await this.adminsService.findOne(payload.sub);

      if (!admin) {
        throw new UnauthorizedException('Admin access required');
      }

      return admin;
    } catch (error) {
      throw new UnauthorizedException('Invalid admin credentials');
    }
  }
}

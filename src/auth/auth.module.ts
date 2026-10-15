import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { AdminController } from './admin.controller';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from 'src/users/users.module';
import { AdminsModule } from 'src/admins/admins.module';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy';
import { AdminJwtStrategy } from './admin-jwt.strategy';
import { EmailModule } from 'src/email/email.module';

@Module({
  imports: [
    UsersModule,
    AdminsModule,
    PassportModule,
    EmailModule,
    JwtModule.registerAsync({
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: { expiresIn: '7d' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController, AdminController],
  providers: [AuthService, JwtStrategy, AdminJwtStrategy],
})
export class AuthModule {}

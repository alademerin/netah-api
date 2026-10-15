import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

@Injectable()
export class Must2FAGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const admin = request.user;

    if (!admin) {
      return true;
    }

    // If admin hasn't enabled 2FA, block access
    if (admin.twoFactorEnabled !== true) {
      throw new ForbiddenException(
        'You must set up 2FA before accessing this resource. Please complete 2FA setup first.',
      );
    }

    return true;
  }
}

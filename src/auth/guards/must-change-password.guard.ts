import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';

@Injectable()
export class MustChangePasswordGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const admin = request.user;

    if (!admin) {
      return true;
    }

    // If admin must change password, block access
    if (admin.mustChangePassword === true) {
      throw new ForbiddenException(
        'You must change your password before accessing this resource. Please use the change-password endpoint.',
      );
    }

    return true;
  }
}

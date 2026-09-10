import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  // Override handleRequest to not throw when user is not found
  handleRequest(err: any, user: any) {
    // Return user if valid, undefined if not - don't throw
    return user;
  }
}

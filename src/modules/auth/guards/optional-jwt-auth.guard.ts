import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err, user, info) {
    // ❌ Normally, JwtAuthGuard throws error if no user or invalid token
    // ✅ Here we just return null instead of throwing
    if (err || !user) {
      return null;
    }
    return user;
  }
}

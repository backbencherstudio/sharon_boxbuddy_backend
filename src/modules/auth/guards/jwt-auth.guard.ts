import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { PUBLIC_KEY } from 'src/common/guard/public';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    // const reflector = new Reflector();
    //  const isPublic = reflector.getAllAndOverride<boolean>(PUBLIC_KEY, [
    //   context.getHandler(),
    //   context.getClass(),
    // ]);
 
    // if (isPublic) {
    //   // If route is public, bypass authentication
    //   return true;
    // }
    // Add your custom authentication logic here
    // for example, call super.logIn(request) to establish a session.
    return super.canActivate(context);
  }

  handleRequest(err, user, info) {
    // You can throw an exception based on either "info" or "err" arguments
    if (err || !user) {
      throw err || new UnauthorizedException();
    }
    return user;
  }
}

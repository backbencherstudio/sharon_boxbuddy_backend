import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import appConfig from '../../../config/app.config';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      // ignoreExpiration: false,
      ignoreExpiration: true,
      secretOrKey: appConfig().jwt.secret,
    });
  }

  async validate(payload: any) {
    // Check if user is blocked
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { is_blocked: true },
    });

    if (user?.is_blocked) {
      throw new UnauthorizedException(
        'Your account has been blocked. Please contact support.',
      );
    }

    return { userId: payload.sub, email: payload.email };
  }
}

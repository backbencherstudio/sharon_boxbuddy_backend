import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-facebook';
import appConfig from 'src/config/app.config';

@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy, 'facebook') {
  constructor() {
    super({
      clientID: appConfig().auth.facebook.app_id,
      clientSecret: appConfig().auth.facebook.app_secret,
      callbackURL: appConfig().auth.facebook.callback,
      scope: 'email',
      profileFields: ['emails', 'name', 'displayName', 'photos'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: (err: any, user: any, info?: any) => void,
  ): Promise<any> {
    const { name, emails, photos, id } = profile;
    const user = {
      email: emails[0].value,
      firstName: name.givenName,
      lastName: name.familyName,
      picture: photos[0].value,
      accessToken,
      facebook_id: id,
    };

    done(null, user);
  }
}

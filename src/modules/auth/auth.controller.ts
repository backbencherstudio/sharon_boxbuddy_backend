import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  Patch,
  Post,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { diskStorage, memoryStorage } from 'multer';
import appConfig from 'src/config/app.config';
import { AuthService } from './auth.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LocalAuthGuard } from './guards/local-auth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @ApiOperation({ summary: 'Get user details' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@Req() req: Request) {
    try {
      const user_id = req.user.userId;
      const response = await this.authService.me(user_id);
      return response;
    } catch (error) {
      return {
        success: false,
        message: 'Failed to fetch user details',
      };
    }
  }

  @ApiOperation({ summary: 'Register a user' })
  @Post('register')
  async create(@Body() data: CreateUserDto) {
    try {
      // const name = data.name;
      const first_name = data.first_name;
      const last_name = data.last_name;
      const email = data.email;
      const password = data.password;
      const type = data.type;

      // if (!name) {
      //   throw new HttpException('Name not provided', HttpStatus.UNAUTHORIZED);
      // }
      if (!first_name) {
        throw new HttpException(
          'First name not provided',
          HttpStatus.UNAUTHORIZED,
        );
      }
      if (!last_name) {
        throw new HttpException(
          'Last name not provided',
          HttpStatus.UNAUTHORIZED,
        );
      }
      if (!email) {
        throw new HttpException('Email not provided', HttpStatus.UNAUTHORIZED);
      }
      if (!password) {
        throw new HttpException(
          'Password not provided',
          HttpStatus.UNAUTHORIZED,
        );
      }

      const response = await this.authService.register({
        name: first_name + ' ' + last_name,
        first_name: first_name,
        last_name: last_name,
        email: email,
        password: password,
        type: type,
      });

      return response;
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  // login user
  @ApiOperation({ summary: 'Login user' })
  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Req() req: Request) {
    try {
      const user_id = req.user.id;

      const user_email = req.user.email;

      const response = await this.authService.login({
        userId: user_id,
        email: user_email,
      });

      return response;
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleLogin(): Promise<any> {
    return HttpStatus.OK;
  }

  // @Get('google/redirect')
  // @UseGuards(AuthGuard('google'))
  // async googleLoginRedirect(@Req() req: Request): Promise<any> {
  //   return {
  //     statusCode: HttpStatus.OK,
  //     data: req.user,
  //   };
  // }

  @Get('google/redirect')
  @UseGuards(AuthGuard('google'))
  async googleLoginRedirect(
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<any> {
    try {
      const email = req.user.email;
      const first_name = req.user?.firstName;
      const last_name = req.user?.lastName;
      const name = req.user?.firstName + ' ' + req.user?.lastName;

      const response = await this.authService.googleLogin(
        email,
        name,
        first_name,
        last_name,
      );

      if (response.success) {
        res.redirect(
          `${appConfig().app.client_app_url}/auth/google?token=${response.token}&userRole=${response.type}`,
        );
      } else {
        return {
          success: false,
          message: 'Google login failed',
        };
      }
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @Get('facebook')
  @UseGuards(AuthGuard('facebook'))
  async facebookLogin(): Promise<void> {
    // The passport middleware will handle the redirect to Facebook
  }

  @Get('facebook/redirect')
  @UseGuards(AuthGuard('facebook'))
  async facebookLoginRedirect(
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<any> {
    try {
      const email = req.user.email;
      const first_name = req.user?.firstName;
      const last_name = req.user?.lastName;
      const facebook_id = req.user?.facebook_id;
      const name = req.user?.firstName + ' ' + req.user?.lastName;

      const response = await this.authService.facebookLogin(
        email,
        name,
        first_name,
        last_name,
        facebook_id,
      );

      if (response.success) {
        res.redirect(
          `${appConfig().app.client_app_url}/auth/facebook?token=${response.token}&userRole=${response.type}`,
        );
      } else {
        return {
          success: false,
          message: 'Facebook login failed',
        };
      }
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  // update user
  @ApiOperation({ summary: 'Update user' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch('update')
  @UseInterceptors(
    FileInterceptor('avatar', {
      storage: diskStorage({
        destination:
          appConfig().storageUrl.rootUrl + appConfig().storageUrl.avatar,
        filename: (req, file, cb) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          return cb(null, `${randomName}${file.originalname.replace(/\s+/g, '-')}`);
        },
      }),
      // storage: memoryStorage(),
    }),
  )
  async updateUser(
    @Req() req: Request,
    @Body() data: UpdateUserDto,
    @UploadedFile() image: Express.Multer.File,
  ) {
    try {
      const user_id = req.user.userId;
      const response = await this.authService.updateUser(user_id, data, image);
      return response;
    } catch (error) {
      return {
        success: false,
        message: 'Failed to update user',
      };
    }
  }

  // --------------change password---------

  @ApiOperation({ summary: 'Forgot password' })
  @Post('forgot-password')
  async forgotPassword(@Body() data: { email: string }) {
    try {
      const email = data.email;
      if (!email) {
        throw new HttpException('Email not provided', HttpStatus.UNAUTHORIZED);
      }
      return await this.authService.forgotPassword(email);
    } catch (error) {
      return {
        success: false,
        message: 'Something went wrong',
      };
    }
  }

  // verify email to verify the email
  @ApiOperation({ summary: 'Verify email' })
  @Post('verify-email')
  async verifyEmail(@Body() data: VerifyEmailDto) {
    try {
      const email = data.email;
      const token = data.token;
      if (!email) {
        throw new HttpException('Email not provided', HttpStatus.UNAUTHORIZED);
      }
      if (!token) {
        throw new HttpException('Token not provided', HttpStatus.UNAUTHORIZED);
      }
      return await this.authService.verifyEmail({
        email: email,
        token: token,
      });
    } catch (error) {
      return {
        success: false,
        message: 'Failed to verify email',
      };
    }
  }

  // resend verification email to verify the email
  @ApiOperation({ summary: 'Resend verification email' })
  @Post('resend-verification-email')
  async resendVerificationEmail(@Body() data: { email: string }) {
    try {
      const email = data.email;
      if (!email) {
        throw new HttpException('Email not provided', HttpStatus.UNAUTHORIZED);
      }
      return await this.authService.resendVerificationEmail(email);
    } catch (error) {
      return {
        success: false,
        message: 'Failed to resend verification email',
      };
    }
  }

  // reset password if user forget the password
  @ApiOperation({ summary: 'Reset password' })
  @Post('reset-password')
  async resetPassword(
    @Body() data: { email: string; token: string; password: string },
  ) {
    try {
      const email = data.email;
      const token = data.token;
      const password = data.password;
      if (!email) {
        throw new HttpException('Email not provided', HttpStatus.UNAUTHORIZED);
      }
      if (!token) {
        throw new HttpException('Token not provided', HttpStatus.UNAUTHORIZED);
      }
      if (!password) {
        throw new HttpException(
          'Password not provided',
          HttpStatus.UNAUTHORIZED,
        );
      }
      return await this.authService.resetPassword({
        email: email,
        token: token,
        password: password,
      });
    } catch (error) {
      return {
        success: false,
        message: 'Something went wrong',
      };
    }
  }

  // change password if user want to change the password
  @ApiOperation({ summary: 'Change password' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  async changePassword(
    @Req() req: Request,
    @Body() data: { email: string; old_password: string; new_password: string },
  ) {
    try {
      // const email = data.email;
      const user_id = req.user.userId;

      const oldPassword = data.old_password;
      const newPassword = data.new_password;
      // if (!email) {
      //   throw new HttpException('Email not provided', HttpStatus.UNAUTHORIZED);
      // }
      if (!oldPassword) {
        throw new HttpException(
          'Old password not provided',
          HttpStatus.UNAUTHORIZED,
        );
      }
      if (!newPassword) {
        throw new HttpException(
          'New password not provided',
          HttpStatus.UNAUTHORIZED,
        );
      }
      return await this.authService.changePassword({
        // email: email,
        user_id: user_id,
        oldPassword: oldPassword,
        newPassword: newPassword,
      });
    } catch (error) {
      return {
        success: false,
        message: 'Failed to change password',
      };
    }
  }

  // --------------end change password---------

  // -------change email address------
  @ApiOperation({ summary: 'request email change' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('request-email-change')
  async requestEmailChange(
    @Req() req: Request,
    @Body() data: { email: string },
  ) {
    try {
      const user_id = req.user.userId;
      const email = data.email;
      if (!email) {
        throw new HttpException('Email not provided', HttpStatus.UNAUTHORIZED);
      }
      return await this.authService.requestEmailChange(user_id, email);
    } catch (error) {
      return {
        success: false,
        message: 'Something went wrong',
      };
    }
  }

  @ApiOperation({ summary: 'Change email address' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('change-email')
  async changeEmail(
    @Req() req: Request,
    @Body() data: { email: string; token: string },
  ) {
    try {
      const user_id = req.user.userId;
      const email = data.email;

      const token = data.token;
      if (!email) {
        throw new HttpException('Email not provided', HttpStatus.UNAUTHORIZED);
      }
      if (!token) {
        throw new HttpException('Token not provided', HttpStatus.UNAUTHORIZED);
      }
      return await this.authService.changeEmail({
        user_id: user_id,
        new_email: email,
        token: token,
      });
    } catch (error) {
      return {
        success: false,
        message: 'Something went wrong',
      };
    }
  }
  // -------end change email address------

  // --------- 2FA ---------
  @ApiOperation({ summary: 'Generate 2FA secret' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('generate-2fa-secret')
  async generate2FASecret(@Req() req: Request) {
    try {
      const user_id = req.user.userId;
      return await this.authService.generate2FASecret(user_id);
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @ApiOperation({ summary: 'Verify 2FA' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('verify-2fa')
  async verify2FA(@Req() req: Request, @Body() data: { token: string }) {
    try {
      const user_id = req.user.userId;
      const token = data.token;
      return await this.authService.verify2FA(user_id, token);
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @ApiOperation({ summary: 'Enable 2FA' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('enable-2fa')
  async enable2FA(@Req() req: Request) {
    try {
      const user_id = req.user.userId;
      return await this.authService.enable2FA(user_id);
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @ApiOperation({ summary: 'Disable 2FA' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('disable-2fa')
  async disable2FA(@Req() req: Request) {
    try {
      const user_id = req.user.userId;
      return await this.authService.disable2FA(user_id);
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }
  // --------- end 2FA ---------
}

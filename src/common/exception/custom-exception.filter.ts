import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
} from '@nestjs/common';
import { MulterError } from 'multer';
import { object } from 'zod';

function isObject(value: any): value is { message: string; details?: any } {
  return typeof value === 'object' && value !== null;
}

function isString(value: any): value is string {
  return typeof value === 'string';
}

@Catch(HttpException)
export class CustomExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse();
    let status = exception.getStatus();
    let responseBody: any;
    const exceptionResponse = exception?.getResponse();

    // Handle Multer file size errors
    if (exception instanceof MulterError) {
      if (exception.code === 'LIMIT_FILE_SIZE') {
        status = 400;
        responseBody = {
          message: 'File too large. Maximum allowed size is 5MB',
        };
      } else {
        responseBody = {
          message: `File upload error: ${exception.message}`
        };
      }

      return response.status(status).json({
        success: false,
        ...responseBody,
      });

    }

    if (isObject(exceptionResponse)) {
      responseBody = exceptionResponse;
    } else if(isString(exceptionResponse)) {
      responseBody = {
        message: exceptionResponse,
      };
    }else {
      responseBody = {
        message: 'Internal Server Error',
      };
    }



    // console.log('exception', exception.getResponse());
    // Return custom error response format
    response.status(status).json({
      success: false,
      // message: exception.message || 'An error occurred',
      // message: exception.getResponse(),
      ...responseBody,
    });
  }
}

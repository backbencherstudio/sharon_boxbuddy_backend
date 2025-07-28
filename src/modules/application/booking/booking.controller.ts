import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, UseInterceptors, UploadedFile } from '@nestjs/common';
import { BookingService } from './booking.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { Request } from 'express';
import { CancelReasonDto } from './dto/cancel-reason.dto';
import { ProblemWithPackageDto } from './dto/problem-with-package.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import appConfig from 'src/config/app.config';

@ApiTags('Travel')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('booking')
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @Post()
  async create(@Body() createBookingDto: CreateBookingDto, @Req() req: Request) {
      return await this.bookingService.create(createBookingDto, req?.user?.userId);
  }

  // @Get()
  // findAll() {
  //   return this.bookingService.findAll();
  // }

  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: Request) {
    return await this.bookingService.findOne(id, req?.user?.userId);
  }

  @Patch(':id/cancel')
  async cancelBooking(@Param('id') id: string, @Req() req: Request, @Body() cancelReasonDto: CancelReasonDto) {
    return await this.bookingService.cancelBooking(id, req?.user?.userId, cancelReasonDto);
  }

  
  

  @Patch(':id/problem-with-package')
  @UseInterceptors(
    FileInterceptor('problem_photo',
      {
        storage: diskStorage({
          destination:
            appConfig().storageUrl.rootUrl + appConfig().storageUrl.problem,
            filename: (req, file, cb) => {
              const randomName = Array(32)
                .fill(null)
                .map(() => Math.round(Math.random() * 16).toString(16))
                .join('');
              return cb(
                null,
                `${randomName}${file.originalname.replace(/\s+/g, '-')}`,
              );
            },
          }
        ),
        // storage: memoryStorage(),
        limits: {
          fileSize: 5 * 1024 * 1024, // 5MB in bytes
        },
      }
    ),
  )
  async problemWithPackage(@Param('id') id: string, @Req() req: Request, @Body() problemWithPackageDto: ProblemWithPackageDto, @UploadedFile() problem_photo: Express.Multer.File) {
    if(problem_photo){
      problemWithPackageDto.problem_photo = problem_photo?.filename;
    }
    return await this.bookingService.problemWithPackage(id, req?.user?.userId, problemWithPackageDto);
  }

  
  @Patch(":id/pick-up")
  @UseInterceptors(
    FileInterceptor('pick_up_photo', {
      storage: diskStorage({
        destination: appConfig().storageUrl.rootUrl + appConfig().storageUrl.pickUp,
        filename: (req, file, cb) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          return cb(null, `${randomName}${file.originalname.replace(/\s+/g, '-')}`);
        },
      }),
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    })
  )
  @UseInterceptors(
    FileInterceptor('pick_up_owner_sign', {
      storage: diskStorage({
        destination: appConfig().storageUrl.rootUrl + appConfig().storageUrl.pickUp,
        filename: (req, file, cb) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          return cb(null, `${randomName}${file.originalname.replace(/\s+/g, '-')}`);
        },
      }),
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    })
  )
  @UseInterceptors(
    FileInterceptor('pick_up_traveller_sign', {
      storage: diskStorage({
        destination: appConfig().storageUrl.rootUrl + appConfig().storageUrl.pickUp,
        filename: (req, file, cb) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          return cb(null, `${randomName}${file.originalname.replace(/\s+/g, '-')}`);
        },
      }),
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    })
  )
  async pickUp(@Param('id') id: string, @Req() req: Request,  
  @UploadedFile() pickUpPhoto: Express.Multer.File,
  @UploadedFile() pickUpOwnerSign: Express.Multer.File,
  @UploadedFile() pickUpTravellerSign: Express.Multer.File) {
    // check if pickUpPhoto, pickUpOwnerSign, pickUpTravellerSign is null
    if(!pickUpPhoto){
      return {
        success: false,
        message: 'pick up photo is required',
      };
    }
    if(!pickUpOwnerSign){
      return {
        success: false,
        message: 'pick up owner sign is required',
      };
    }
    if(!pickUpTravellerSign){
      return {
        success: false,
        message: 'pick up traveller sign is required',
      };
    }

    const photos = {
      pick_up_photo: pickUpPhoto.filename, 
      pick_up_owner_sign: pickUpOwnerSign.filename, 
      pick_up_traveller_sign: pickUpTravellerSign.filename
    }
    
    return await this.bookingService.pickUp(id, req?.user?.userId, photos);
  }

  // @Patch(':id')
  // update(@Param('id') id: string, @Body() updateBookingDto: UpdateBookingDto) {
  //   return this.bookingService.update(id, updateBookingDto);
  // }

  // @Delete(':id')
  // remove(@Param('id') id: string) {
  //   return this.bookingService.remove(+id);
  // }
}

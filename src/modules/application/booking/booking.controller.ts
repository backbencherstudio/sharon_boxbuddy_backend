import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, UseInterceptors, UploadedFile, UploadedFiles, BadRequestException } from '@nestjs/common';
import { BookingService } from './booking.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { Request } from 'express';
import { CancelReasonDto } from './dto/cancel-reason.dto';
import { ProblemWithPackageDto } from './dto/problem-with-package.dto';
import { FileFieldsInterceptor, FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import appConfig from 'src/config/app.config';
import { AllConditionsAreNotMetDto } from './dto/all-conditions-are-not-met.dto';
import { SummaryDto } from './dto/summary-dto';

@ApiTags('Booking')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('booking')
export class BookingController {
  constructor(private readonly bookingService: BookingService) { }

  @Post()
  async create(@Body() createBookingDto: CreateBookingDto, @Req() req: Request) {
    return await this.bookingService.create(createBookingDto, req?.user?.userId);
  }

  // @Get()
  // findAll() {
  //   return this.bookingService.findAll();
  // }

  @Patch('summary/:id')
  async updateSummary(@Param('id') id: string, @Req() req: Request, @Body() summaryDto: SummaryDto){
    return await this.bookingService.updateSummary(id, req?.user?.userId, summaryDto.summary);
  }

  // bookings as traveler booking/traveller
  @Get('traveller')
  async bookingsAsTraveler(@Req() req: Request) {
    return await this.bookingService.bookingsAsTraveller(req?.user?.userId);
  }

  // bookings as owner booking/package-owner
  @Get('package-owner')
  async bookingsAsPackageOwner(@Req() req: Request) {
    return await this.bookingService.bookingsAsPackageOwner(req?.user?.userId);
  }

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
    if (problem_photo) {
      problemWithPackageDto.problem_photo = problem_photo?.filename;
    }
    return await this.bookingService.problemWithPackage(id, req?.user?.userId, problemWithPackageDto);
  }

  @Patch(':id/all-conditions-are-not-met')
  async allConditonsAreNotMet(@Param('id') id: string, @Req() req: Request, @Body() allConditionsAreNotMetDto: AllConditionsAreNotMetDto) {
    return await this.bookingService.allConditonsAreNotMet(id, req?.user?.userId, allConditionsAreNotMetDto);
  }


  @Patch(":id/pick-up")
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'pick_up_photo', maxCount: 1 },
      { name: 'pick_up_owner_sign', maxCount: 1 },
      { name: 'pick_up_traveller_sign', maxCount: 1 },
    ], {
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
  async pickUp(
    @Param('id') id: string,
    @Req() req: Request,
    @UploadedFiles() files: {
      pick_up_photo?: Express.Multer.File[],
      pick_up_owner_sign?: Express.Multer.File[],
      pick_up_traveller_sign?: Express.Multer.File[]
    }
  ) {
    // check if files exist
    if (!files?.pick_up_photo?.[0]) {
      throw new BadRequestException('Pick up, owner sign and traveller sign photos are required');
    }

    if (!files?.pick_up_owner_sign?.[0]) {
      throw new BadRequestException('Owner sign and traveller sign photos are also required');
    }

    if (!files?.pick_up_traveller_sign?.[0]) {
      throw new BadRequestException('Traveller sign is also required');
    }

    const photos = {
      pick_up_photo: files.pick_up_photo[0].filename,
      pick_up_owner_sign: files.pick_up_owner_sign[0].filename,
      pick_up_traveller_sign: files.pick_up_traveller_sign[0].filename
    }

    return await this.bookingService.pickUp(id, req?.user?.userId, photos);
  }

  @Patch(":id/drop-off")
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'drop_off_photo', maxCount: 1 },
      { name: 'drop_off_owner_sign', maxCount: 1 },
      { name: 'drop_off_traveller_sign', maxCount: 1 },
    ], {
      storage: diskStorage({
        destination: appConfig().storageUrl.rootUrl + appConfig().storageUrl.dropOff,
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
  async dropOff(
    @Param('id') id: string,
    @Req() req: Request,
    @UploadedFiles() files: {
      drop_off_photo?: Express.Multer.File[],
      drop_off_owner_sign?: Express.Multer.File[],
      drop_off_traveller_sign?: Express.Multer.File[]
    }
  ) {
    // check if files exist
    if (!files?.drop_off_photo?.[0]) {
      throw new BadRequestException('Drop off, owner sign and traveller sign photos are required');
    }

    if (!files?.drop_off_owner_sign?.[0]) {
      throw new BadRequestException('Owner sign and traveller sign photos are also required');
    }

    if (!files?.drop_off_traveller_sign?.[0]) {
      throw new BadRequestException('Traveller sign is also required');
    }

    const photos = {
      drop_off_photo: files.drop_off_photo[0].filename,
      drop_off_owner_sign: files.drop_off_owner_sign[0].filename,
      drop_off_traveller_sign: files.drop_off_traveller_sign[0].filename
    }

    return await this.bookingService.dropOff(id, req?.user?.userId, photos);
  }

  
  @Patch(":id/complete")
  async complete(@Param('id') id: string, @Req() req: Request) {
    return await this.bookingService.complete(id, req?.user?.userId);
  }

  @Patch(":id/reject")
  async reject(@Param('id') id: string, @Req() req: Request) {
    return await this.bookingService.reject(id, req?.user?.userId);
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

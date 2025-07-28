import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { CancelReasonDto } from './dto/cancel-reason.dto';
import { ProblemWithPackageDto } from './dto/problem-with-package.dto';
import { SojebStorage } from 'src/common/lib/Disk/SojebStorage';
import appConfig from 'src/config/app.config';

@Injectable()
export class BookingService {
  constructor(private readonly prisma: PrismaService) { }
  async create(createBookingDto: CreateBookingDto, user_id: string) {
    // check travel is exist or not
    const travel = await this.prisma.travel.findUnique({
      where: {
        id: createBookingDto.travel_id,
      },
    });

    if (!travel) {
      throw new BadRequestException('Travel not found');
    }

    // check package is exist or not
    const package_data = await this.prisma.package.findFirst({
      where: {
        id: createBookingDto.package_id,
        owner_id: user_id,
      },
    });

    console.log(user_id)

    console.log(await this.prisma.package.findFirst({
      where: {
        id: createBookingDto.package_id,
        owner_id: user_id,
      },
    }))

    if (!package_data) {
      throw new BadRequestException('Package not found');
    }

    const data: any = {
      ...createBookingDto,
      traveller_id: travel.user_id,
      owner_id: user_id,
    }
    // check with this data already any booking is exist or not with status in_progress
    let booking_data = await this.prisma.booking.findFirst({
      where: {
        travel_id: createBookingDto.travel_id,
        package_id: createBookingDto.package_id,
        status: {
          in: ["in_progress",
            "pick_up",
            "on_the_way",
            "delivered"],
        },
      },
    });

    if (booking_data) {
      throw new BadRequestException('Booking already exist');
    }

    // create a booking data
    booking_data = await this.prisma.booking.create({
      data,
    });

    return {
      success: true,
      message: 'Booking created successfully',
      data: booking_data,
    };
  }

  // findAll() {
  //   return `This action returns all booking`;
  // }

  async findOne(id: string, user_id: string) {
    const booking_data = await this.prisma.booking.findFirst({
      where: {
        id,
        OR: [
          {
            traveller_id: user_id,
          },
          {
            owner_id: user_id,
          },
        ],
      },
      include: {
        travel: true,
        package: true,
        traveller: true,
        owner: true,
      },
    });

    if (!booking_data) {
      throw new BadRequestException('Booking not found');
    }

    return {
      success: true,
      message: 'Booking found successfully',
      data: booking_data,
    };
  }

  // update(id: string, updateBookingDto: UpdateBookingDto) {
  //   return `This action updates a #${id} booking`;
  // }

  // remove(id: number) {
  //   return `This action removes a #${id} booking`;
  // }

  async cancelBooking(id: string, user_id: string, cancelReasonDto: CancelReasonDto) {
    const booking_data = await this.prisma.booking.findFirst({
      where: {
        id,
      },
    });

    if (!booking_data) {
      throw new BadRequestException('Booking not found');
    }

    if (booking_data.status === 'cancel') {
      throw new BadRequestException('Booking already cancelled');
    }

    if (booking_data.traveller_id !== user_id && booking_data.owner_id !== user_id) {
      throw new BadRequestException('You are not allowed to cancel this booking');
    }

    const data: any = {
      ...cancelReasonDto,
      cancel_by_id: user_id,
      cancel: true,
      status: 'cancel'
    }

    if (booking_data.traveller_id === user_id) {
      data['cancel_by_who'] = 'traveller'
    } else {
      data['cancel_by_who'] = 'package_owner'
    }

    const updated_booking_data = await this.prisma.booking.update({
      where: {
        id,
      },
      data,
    });

    return {
      success: true,
      message: 'Booking cancelled successfully',
      data: updated_booking_data,
    };

  }

  async problemWithPackage(id: string, user_id: string, problemWithPackageDto: ProblemWithPackageDto) {
    const booking_data = await this.prisma.booking.findFirst({
      where: {
        id,
        traveller_id: user_id,
      },
    });

    if (!booking_data) {
      throw new BadRequestException('Booking not found');
    }

    if (booking_data.status !== 'on_the_way') {
      throw new BadRequestException('You can not report a problem with the package');
    }

    const data: any = {
      ...problemWithPackageDto,
      problem: true,
      status: 'problem_with_the_package'
    }

    const updated_booking_data = await this.prisma.booking.update({
      where: {
        id,
      },
      data,
    });

    return {
      success: true,
      message: 'Problem with package reported successfully',
      data: updated_booking_data,
    };
  }


  async pickUp(id: string, user_id: string, photos: {
    pick_up_photo: string,
    pick_up_owner_sign: string,
    pick_up_traveller_sign: string,
  }) {
    const booking_data = await this.prisma.booking.findFirst({
      where: {
        id,
        traveller_id: user_id,
      },
    });

    if (!booking_data) {
      throw new BadRequestException('Booking not found');
    }

    if (booking_data.status !== 'in_progress') {
      throw new BadRequestException('You can not pick up the package');
    }


    const data: any = {
      status: 'pick_up',
      ...photos
    }

    const updated_booking_data = await this.prisma.booking.update({
      where: {
        id,
      },
      data,
    });

    updated_booking_data['pick_up_photo_url'] = SojebStorage.url(appConfig().storageUrl.pickUp + updated_booking_data.pick_up_photo);
    updated_booking_data['pick_up_owner_sign_url'] = SojebStorage.url(appConfig().storageUrl.pickUp + updated_booking_data.pick_up_owner_sign);
    updated_booking_data['pick_up_traveller_sign_url'] = SojebStorage.url(appConfig().storageUrl.pickUp + updated_booking_data.pick_up_traveller_sign);


    return {
      success: true,
      message: 'Package picked up successfully',
      data: updated_booking_data,
    };

  }


}

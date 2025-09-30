import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { CancelReasonDto } from './dto/cancel-reason.dto';
import { ProblemWithPackageDto } from './dto/problem-with-package.dto';
import { SojebStorage } from 'src/common/lib/Disk/SojebStorage';
import appConfig from 'src/config/app.config';
import { AllConditionsAreNotMetDto } from './dto/all-conditions-are-not-met.dto';
import { StripePayment } from 'src/common/lib/Payment/stripe/StripePayment';

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

    // console.log(user_id)

    // console.log(await this.prisma.package.findFirst({
    //   where: {
    //     id: createBookingDto.package_id,
    //     owner_id: user_id,
    //   },
    // }))

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
          in: [
            "pending",
            "in_progress",
            "pick_up",
            "on_the_way",
            "delivered"
          ],
        },
      },
    });

    if (booking_data) {
      return {
        success: true,
        message: 'Booking retrieved successfully',
        data: booking_data,
      };
      // throw new BadRequestException('Booking already exist');
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

  async bookingsAsTraveller(user_id: string) {
    const bookings = await this.prisma.booking.findMany({
      where: {
        traveller_id: user_id,
      },
      include: {
        travel: true,
        package: true,
        traveller: {
          select: {
            id: true,
            name: true,
            first_name: true,
            last_name: true,
            phone_number: true,
            email: true,
            avatar: true,
          },
        },
        owner: {
          select: {
            id: true,
            name: true,
            first_name: true,
            last_name: true,
            phone_number: true,
            email: true,
            avatar: true,
          },
        },
      },
    });

    return {
      success: true,
      message: 'Bookings found successfully',
      data: bookings,
    };
  }

  async bookingsAsPackageOwner(user_id: string) {
    const bookings = await this.prisma.booking.findMany({
      where: {
        owner_id: user_id,
      },
      include: {
        travel: true,
        package: true,
        traveller: {
          select: {
            id: true,
            name: true,
            first_name: true,
            last_name: true,
            phone_number: true,
            email: true,
            avatar: true,
          },
        },
        owner: {
          select: {
            id: true,
            name: true,
            first_name: true,
            last_name: true,
            phone_number: true,
            email: true,
            avatar: true,
          },
        },
      },
    });

    return {
      success: true,
      message: 'Bookings found successfully',
      data: bookings,
    };
  }

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
        traveller: {
          select: {
            id: true,
            name: true,
            first_name: true,
            last_name: true,
            phone_number: true,
            email: true,
            avatar: true,
          },
        },
        owner: {
          select: {
            id: true,
            name: true,
            first_name: true,
            last_name: true,
            phone_number: true,
            email: true,
            avatar: true,
          },
        },
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
      include: {
        traveller: {
          select: {
            first_name: true,
          }
        },
        owner: {
          select: {
            first_name: true,
          }
        }
      }
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
      
      // notification
      await this.prisma.notification.createMany({
        data: [
          {
            notification_message: `${booking_data.traveller.first_name} has canceled the booking. You have been refunded.`,
            notification_type: 'canceled',
            receiver_id: booking_data.owner_id
          },
          // {
          //   notification_message: `You canceled ${booking_data.owner.first_name}'s booking request.`,
          //   notification_type: 'canceled',
          //   receiver_id: booking_data.traveller_id
          // }
        ]
      })

      
      // need to adjust wallet based on remaining hours


    } else {
      data['cancel_by_who'] = 'package_owner'

      // notification
      await this.prisma.notification.createMany({
        data: [
          // {
          //   notification_message: `You canceled your booking request.`,
          //   notification_type: 'canceled',
          //   receiver_id: booking_data.owner_id
          // },
          {
            notification_message: `${booking_data.owner.first_name} canceled their booking request.`,
            notification_type: 'canceled',
            receiver_id: booking_data.traveller_id
          }
        ]
      })

      

      // need to adjust wallet based on remaining hours

    }

    const updated_booking_data = await this.prisma.booking.update({
      where: {
        id,
      },
      data,
    });

    // conversation
    await this.prisma.conversation.updateMany({
      where: {
        travel_id: updated_booking_data.travel_id,
        package_id: updated_booking_data.package_id,
      },
      data: {
        notification_type: 'canceled'
      }
    })

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

    if (booking_data.status !== 'pick_up') {
      throw new BadRequestException('You can not pick up the package');
    }


    const data: any = {
      status: 'on_the_way',
      ...photos
    }

    const updated_booking_data = await this.prisma.booking.update({
      where: {
        id,
      },
      data,
    });

    if (!updated_booking_data) {
      throw new BadRequestException('Something went wrong');
    }

    // if (updated_booking_data.problem_photo) {
    //   updated_booking_data['problem_photo_url'] = SojebStorage.url(appConfig().storageUrl.pickUp + updated_booking_data.problem_photo);
    // }

    // if (updated_booking_data.pick_up_photo) {
    //   updated_booking_data['pick_up_photo_url'] = SojebStorage.url(appConfig().storageUrl.pickUp + updated_booking_data.pick_up_photo);
    // }

    // if (updated_booking_data.pick_up_owner_sign) {
    //   updated_booking_data['pick_up_owner_sign_url'] = SojebStorage.url(appConfig().storageUrl.pickUp + updated_booking_data.pick_up_owner_sign);
    // }

    // if (updated_booking_data.pick_up_traveller_sign) {
    //   updated_booking_data['pick_up_traveller_sign_url'] = SojebStorage.url(appConfig().storageUrl.pickUp + updated_booking_data.pick_up_traveller_sign);
    // }

    return {
      success: true,
      message: 'Package picked up successfully',
      data: updated_booking_data,
    };

  }

  async dropOff(id: string, user_id: string, photos: {
    drop_off_photo: string,
    drop_off_owner_sign: string,
    drop_off_traveller_sign: string,
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

    if (booking_data.status !== 'on_the_way' && booking_data.status !== 'rejected') {
      throw new BadRequestException('You can not deliver the package');
    }


    const data: any = {
      status: 'delivered',
      ...photos
    }

    const updated_booking_data = await this.prisma.booking.update({
      where: {
        id,
      },
      data,
    });

    if (!updated_booking_data) {
      throw new BadRequestException('Something went wrong');
    }

    // if (updated_booking_data.problem_photo) {
    //   updated_booking_data['problem_photo_url'] = SojebStorage.url(appConfig().storageUrl.pickUp + updated_booking_data.problem_photo);
    // }

    // if (updated_booking_data.pick_up_photo) {
    //   updated_booking_data['pick_up_photo_url'] = SojebStorage.url(appConfig().storageUrl.pickUp + updated_booking_data.pick_up_photo);
    // }

    // if (updated_booking_data.pick_up_owner_sign) {
    //   updated_booking_data['pick_up_owner_sign_url'] = SojebStorage.url(appConfig().storageUrl.pickUp + updated_booking_data.pick_up_owner_sign);
    // }

    // if (updated_booking_data.pick_up_traveller_sign) {
    //   updated_booking_data['pick_up_traveller_sign_url'] = SojebStorage.url(appConfig().storageUrl.pickUp + updated_booking_data.pick_up_traveller_sign);
    // }

    return {
      success: true,
      message: 'Package picked up successfully',
      data: updated_booking_data,
    };

  }


  async complete(id: string, user_id: string) {
    const booking_data = await this.prisma.booking.findFirst({
      where: {
        id,
        owner_id: user_id,
      },
    });

    if (!booking_data) {
      throw new NotFoundException('Booking not found');
    }

    if (booking_data.status !== 'delivered') {
      throw new ForbiddenException('You can not complete the package');
    }

    const data: any = {
      status: 'completed',
      confirmed: true,

    }

    const updated_booking_data = await this.prisma.booking.update({
      where: {
        id,
      },
      data: {
        ...data
      },
    });

    return {
      success: true,
      message: 'Package delivered complated successfully',
      data: updated_booking_data,
    };
  }

  async reject(id: string, user_id: string) {
    const booking_data = await this.prisma.booking.findFirst({
      where: {
        id,
        owner_id: user_id,
      },
    });

    if (!booking_data) {
      throw new BadRequestException('Booking not found');
    }
    if (booking_data.status !== 'delivered') {
      throw new BadRequestException('You can not reject the package');
    }
    const data: any = {
      status: 'rejected',
      confirmed: false,
    }

    const updated_booking_data = await this.prisma.booking.update({
      where: {
        id,
      },
      data,
    });

    return {
      success: true,
      message: 'Package rejected successfully',
      data: updated_booking_data,
    };
  }

  async allConditonsAreNotMet(id: string, user_id: string, allConditionsAreNotMetDto: AllConditionsAreNotMetDto) {
    const booking_data = await this.prisma.booking.findFirst({
      where: {
        id,
        traveller_id: user_id,
      },
    });

    if (!booking_data) {
      throw new BadRequestException('Booking not found');
    }

    if (booking_data.status !== 'pick_up') {
      throw new BadRequestException('You can not report all conditions are not met with the package');
    }

    if (allConditionsAreNotMetDto.report_details) {
      await this.prisma.report.create({
        data: {
          package_id: booking_data.package_id,
          details_description: allConditionsAreNotMetDto.report_details,
          reported_by_id: user_id,
          report_for: 'package'
        }
      })
    }

    const data: any = {
      status: 'all_conditions_are_not_met',
      all_conditions_are_not_met: true,
      all_conditions_are_not_met_reason: allConditionsAreNotMetDto.all_conditions_are_not_met_reason
    }

    const updated_booking_data = await this.prisma.booking.update({
      where: {
        id,
      },
      data,
    });

    return {
      success: true,
      message: 'All conditions are not met',
      data: updated_booking_data,
    };
  }

  // Get Payment intent
  // ...existing code...
  // ...existing code...

  // Get Payment intent
  async getPaymentIntent(booking_id: string) {
    // Find booking
    const booking = await this.prisma.booking.findUnique({
      where: { id: booking_id },
      include: { traveller: true },
    });

    if (!booking) {
      throw new BadRequestException('Booking not found');
    }

    // You may want to check if the booking is eligible for payment here

    // Get customer_id (Stripe) from traveller or booking
    const customer_id = booking.traveller?.stripeCustomerId;
    if (!customer_id) {
      throw new BadRequestException('No Stripe customer found for traveller');
    }

    // Set amount and currency (customize as needed)
    const amount = 19.99 //booking.amount; // Make sure your booking model has an amount field
    const currency = 'usd';

    // Create PaymentIntent
    const paymentIntent = await StripePayment.createPaymentIntent({
      amount,
      currency,
      customer_id,
      metadata: {
        booking_id: booking.id,
      },
    });

    return {
      success: true,
      client_secret: paymentIntent.client_secret,
      payment_intent_id: paymentIntent.id,
    };
  }



}

import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { GetBookingQueryDto } from './dto/query-booking.dto';
import { BookingStatus } from '@prisma/client';

@Injectable()
export class BookingService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: GetBookingQueryDto) {
    const {
      q,
      status,
      limit = 10,
      page = 1,
      user_id,
      package_id,
      travel_id,
    } = query;
    const where_condition: any = {};

    if (q) {
      where_condition['OR'] = [
        { id: { contains: q, mode: 'insensitive' } },
        { owner: { first_name: { contains: q, mode: 'insensitive' } } },
        { owner: { last_name: { contains: q, mode: 'insensitive' } } },
        { owner: { email: { contains: q, mode: 'insensitive' } } },
        { traveller: { first_name: { contains: q, mode: 'insensitive' } } },
        { traveller: { last_name: { contains: q, mode: 'insensitive' } } },
        { traveller: { email: { contains: q, mode: 'insensitive' } } },
      ];
    }

    if (status) {
      where_condition['status'] = status;
    }

    if (user_id) {
      where_condition['OR'] = [
        { owner_id: { equals: user_id } },
        { traveller_id: { equals: user_id } },
      ];
    }

    if (package_id) {
      where_condition['package_id'] = package_id;
    }

    if (travel_id) {
      where_condition['travel_id'] = travel_id;
    }

    const take = limit;
    const skip = (page - 1) * limit;

    const bookings = await this.prisma.booking.findMany({
      where: where_condition,
      select: {
        id: true,
        status: true,
        amount: true,
        paid: true,
        created_at: true,
        owner: {
          select: {
            first_name: true,
            last_name: true,
            email: true,
          },
        },
        traveller: {
          select: {
            first_name: true,
            last_name: true,
          },
        },
        package: {
          select: {
            pick_up_location: true,
            drop_off_location: true,
          },
        },
        travel: {
          select: {
            departure_from: true,
            arrival_to: true,
            departure: true,
          },
        },
      },
      take: take,
      skip: skip,
      orderBy: {
        created_at: 'desc',
      },
    });

    const total = await this.prisma.booking.count({ where: where_condition });

    // Format for table display
    const formattedBookings = bookings.map((booking) => ({
      id: booking.id,
      status: booking.status,
      amount: booking.amount,
      paid: booking.paid,
      owner_name: `${booking.owner.first_name} ${booking.owner.last_name}`,
      owner_email: booking.owner.email,
      traveller_name: `${booking.traveller.first_name} ${booking.traveller.last_name}`,
      route: `${booking.package.pick_up_location} → ${booking.package.drop_off_location}`,
      flight: `${booking.travel.departure_from} → ${booking.travel.arrival_to}`,
      departure_date: booking.travel.departure,
      created_at: booking.created_at,
    }));

    return {
      success: true,
      message: 'Bookings retrieved successfully',
      data: {
        bookings: formattedBookings,
        total,
        page,
        limit,
      },
    };
  }

  async findAllProblematic(query: GetBookingQueryDto) {
    const { limit = 10, page = 1 } = query;
    const where_condition = {
      status: {
        in: [
          BookingStatus.problem_with_the_package,
          BookingStatus.all_conditions_are_not_met,
        ],
      },
    };

    const take = limit;
    const skip = (page - 1) * limit;

    const bookings = await this.prisma.booking.findMany({
      where: where_condition,
      select: {
        id: true,
        status: true,
        amount: true,
        paid: true,
        created_at: true,
        owner: {
          select: {
            first_name: true,
            last_name: true,
            email: true,
          },
        },
        traveller: {
          select: {
            first_name: true,
            last_name: true,
          },
        },
        package: {
          select: {
            pick_up_location: true,
            drop_off_location: true,
          },
        },
        travel: {
          select: {
            departure_from: true,
            arrival_to: true,
            departure: true,
          },
        },
      },
      take: take,
      skip: skip,
      orderBy: {
        created_at: 'desc',
      },
    });

    const total = await this.prisma.booking.count({ where: where_condition });

    // Format for table display
    const formattedBookings = bookings.map((booking) => ({
      id: booking.id,
      status: booking.status,
      amount: booking.amount,
      paid: booking.paid,
      owner_name: `${booking.owner.first_name} ${booking.owner.last_name}`,
      owner_email: booking.owner.email,
      traveller_name: `${booking.traveller.first_name} ${booking.traveller.last_name}`,
      route: `${booking.package.pick_up_location} → ${booking.package.drop_off_location}`,
      flight: `${booking.travel.departure_from} → ${booking.travel.arrival_to}`,
      departure_date: booking.travel.departure,
      created_at: booking.created_at,
    }));

    return {
      success: true,
      message: 'Bookings retrieved successfully',
      data: {
        bookings: formattedBookings,
        total,
        page,
        limit,
      },
    };
  }

  async findOne(id: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
          },
        },
        traveller: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
          },
        },
        package: true,
        travel: true,
        reviews: true,
      },
    });

    if (!booking) {
      return {
        success: false,
        message: 'Booking not found',
      };
    }

    const conversation = await this.prisma.conversation.findFirst({
      where: {
        travel_id: booking.travel_id,
        package_id: booking.package_id,
      },
      include: {
        messages: {
          orderBy: {
            created_at: 'asc',
          },
        },
      },
    });

    return {
      success: true,
      message: 'Booking retrieved successfully',
      data: { ...booking, conversation },
    };
  }

  async updateStatus(id: string, status: BookingStatus) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
    });

    if (!booking) {
      return {
        success: false,
        message: 'Booking not found',
      };
    }

    await this.prisma.booking.update({
      where: { id },
      data: { status },
    });

    return {
      success: true,
      message: 'Booking status updated successfully',
    };
  }
}

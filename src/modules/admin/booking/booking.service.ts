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
    const where_condition = {};

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
      },
      take: take,
      skip: skip,
      orderBy: {
        created_at: 'desc',
      },
    });

    const total = await this.prisma.booking.count({ where: where_condition });

    return {
      success: true,
      data: {
        bookings,
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
      },
      take: take,
      skip: skip,
      orderBy: {
        created_at: 'desc',
      },
    });

    const total = await this.prisma.booking.count({ where: where_condition });

    return {
      success: true,
      data: {
        bookings,
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

    return {
      success: true,
      data: booking,
    };
  }
}

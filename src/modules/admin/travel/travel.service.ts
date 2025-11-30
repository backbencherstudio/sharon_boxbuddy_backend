import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { GetTravelQueryDto } from './dto/query-travel.dto';

@Injectable()
export class TravelService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: GetTravelQueryDto) {
    const { q, status, limit = 10, page = 1, user_id } = query;
    const where_condition: any = {};

    // Search in travel fields AND user name/email
    if (q) {
      // First, find users matching the search query
      const matchingUsers = await this.prisma.user.findMany({
        where: {
          OR: [
            { first_name: { contains: q, mode: 'insensitive' } },
            { last_name: { contains: q, mode: 'insensitive' } },
            { email: { contains: q, mode: 'insensitive' } },
          ],
        },
        select: { id: true },
      });

      const userIds = matchingUsers.map((user) => user.id);

      // Search in travel fields and matching user_ids
      where_condition['OR'] = [
        { flight_number: { contains: q, mode: 'insensitive' } },
        { airline: { contains: q, mode: 'insensitive' } },
        { departure_from: { contains: q, mode: 'insensitive' } },
        { arrival_to: { contains: q, mode: 'insensitive' } },
        ...(userIds.length > 0 ? [{ user_id: { in: userIds } }] : []),
      ];
    }

    if (user_id) {
      where_condition['user_id'] = user_id;
    }

    const now = new Date();
    if (status === 'upcoming') {
      where_condition['departure'] = { gte: now };
    } else if (status === 'active') {
      where_condition['departure'] = { lte: now };
      where_condition['arrival'] = { gte: now };
    } else if (status === 'completed') {
      where_condition['arrival'] = { lte: now };
    }

    const skip = (page - 1) * limit;

    const [travels, total] = await Promise.all([
      this.prisma.travel.findMany({
        where: where_condition,
        select: {
          id: true,
          flight_number: true,
          airline: true,
          departure_from: true,
          arrival_to: true,
          departure: true,
          arrival: true,
          publish: true,
          created_at: true,
          user: {
            select: {
              first_name: true,
              last_name: true,
            },
          },
        },
        take: limit,
        skip,
        orderBy: {
          created_at: 'desc',
        },
      }),
      this.prisma.travel.count({ where: where_condition }),
    ]);

    // Format for table display
    const formattedTravels = travels.map((travel) => ({
      id: travel.id,
      flight_number: travel.flight_number,
      airline: travel.airline,
      route: `${travel.departure_from} → ${travel.arrival_to}`,
      departure: travel.departure,
      arrival: travel.arrival,
      publish: travel.publish,
      traveller_name: `${travel.user.first_name} ${travel.user.last_name}`,
      created_at: travel.created_at,
    }));

    return {
      success: true,
      message: 'Travels retrieved successfully',
      data: {
        travels: formattedTravels,
        total,
        page,
        limit,
      },
    };
  }

  async findOne(id: string) {
    const travel = await this.prisma.travel.findUnique({
      where: { id },
      include: {
        user: true,
        bookings: true,
        reports: true,
      },
    });
    return {
      success: true,
      message: 'Travel retrieved successfully',
      data: travel,
    };
  }

  async unpublished(id: string) {
    await this.prisma.travel.update({
      where: { id },
      data: { publish: false },
    });
    return {
      success: true,
      message: 'Travel has been cancelled successfully.',
    };
  }
}

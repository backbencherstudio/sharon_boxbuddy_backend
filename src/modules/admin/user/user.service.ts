import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from '../../../prisma/prisma.service';
import { UserRepository } from '../../../common/repository/user/user.repository';
import appConfig from '../../../config/app.config';
import { SojebStorage } from '../../../common/lib/Disk/SojebStorage';
import { DateHelper } from '../../../common/helper/date.helper';
import { GetUserQueryDto } from './dto/query-user.dto';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    const user = await UserRepository.createUser(createUserDto);

    if (user.success) {
      return {
        success: user.success,
        message: user.message,
      };
    } else {
      return {
        success: user.success,
        message: user.message,
      };
    }
  }

  async findAll(query: GetUserQueryDto, currentUserId: string) {
    const { q, type, status, limit = 10, page = 1 } = query;
    const where_condition: any = {
      // Exclude current logged-in user
      id: {
        not: currentUserId,
      },
    };

    if (q) {
      where_condition['OR'] = [
        { first_name: { contains: q, mode: 'insensitive' } },
        { last_name: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
      ];
    }

    if (type) {
      where_condition['type'] = type;
    }

    if (status && status !== 'all') {
      where_condition['is_blocked'] =
        status == 'blocked' ? { equals: true } : { equals: false };
    }

    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where: where_condition,
        select: {
          id: true,
          first_name: true,
          last_name: true,
          email: true,
          phone_number: true,
          is_blocked: true,
          created_at: true,
          _count: {
            select: {
              bookings_owner: {
                where: {
                  status: 'cancel',
                },
              },
              bookings: {
                where: {
                  status: 'cancel',
                },
              },
            },
          },
        },
        take: limit,
        skip,
      }),
      this.prisma.user.count({ where: where_condition }),
    ]);

    // Format users to include total cancelled bookings
    const formattedUsers = users.map((user) => ({
      id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      phone_number: user.phone_number,
      is_blocked: user.is_blocked,
      created_at: user.created_at,
      cancelled_bookings: user._count.bookings_owner + user._count.bookings,
    }));

    return {
      success: true,
      message: 'Users retrieved successfully',
      data: {
        users: formattedUsers,
        total,
        page,
        limit,
      },
    };
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: id,
      },
      select: {
        id: true,
        email: true,
        type: true,
        date_of_birth: true,
        gender: true,
        about_me: true,
        first_name: true,
        last_name: true,
        address: true,
        city: true,
        country: true,
        state: true,
        zip_code: true,
        phone_number: true,
        is_blocked: true,
        approved_at: true,
        created_at: true,
        avatar: true,
        billing_id: true,
        verification_status: true,
        _count: {
          select: {
            travels: true,
            packages_owner: true,
            bookings_owner: {
              where: {
                status: 'cancel',
              },
            },
            bookings: {
              where: {
                status: 'cancel',
              },
            },
          },
        },
        reviews_for: {
          select: {
            rating: true,
            review_from: true,
          },
        },
        reviews_given: {
          select: {
            rating: true,
          },
        },
        payment_transactions: {
          select: {
            amount: true,
            type: true,
          },
        },
      },
    });

    // add avatar url to user
    if (user.avatar) {
      user['avatar_url'] = SojebStorage.url(
        appConfig().storageUrl.avatar + user.avatar,
      );
    }

    if (!user) {
      return {
        success: false,
        message: 'User not found',
      };
    }

    const total_travels_created = user._count.travels;
    const total_packages_sent = user._count.packages_owner;
    const cancelled_bookings =
      user._count.bookings_owner + user._count.bookings;
    const completed_deliveries = await this.prisma.booking.count({
      where: {
        owner_id: id,
        status: 'completed',
      },
    });

    const reviews_as_traveler = user.reviews_for.filter(
      (review) => review['review_from'] === 'package_owner',
    );
    const ratings_as_traveler =
      reviews_as_traveler.reduce((acc, review) => acc + review.rating, 0) /
      (reviews_as_traveler.length || 1);

    const reviews_as_sender = user.reviews_for.filter(
      (review) => review['review_from'] === 'traveller',
    );
    const ratings_as_sender =
      reviews_as_sender.reduce((acc, review) => acc + review.rating, 0) /
      (reviews_as_sender.length || 1);

    const total_earnings = user.payment_transactions
      .filter((t) => t.type === 'order')
      .reduce((acc, t) => acc + Number(t.amount), 0);
    const total_payments_made = user.payment_transactions
      .filter((t) => t.type === 'payment')
      .reduce((acc, t) => acc + Number(t.amount), 0);

    const {
      _count,
      reviews_for,
      reviews_given,
      payment_transactions,
      ...rest
    } = user;

    return {
      success: true,
      message: 'User retrieved successfully',
      data: {
        ...rest,
        total_travels_created,
        total_packages_sent,
        cancelled_bookings,
        completed_deliveries,
        ratings_as_traveler: ratings_as_traveler.toFixed(2),
        ratings_as_sender: ratings_as_sender.toFixed(2),
        total_earnings,
        total_payments_made,
      },
    };
  }

  async approve(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: id },
    });
    if (!user) {
      return {
        success: false,
        message: 'User not found',
      };
    }
    await this.prisma.user.update({
      where: { id: id },
      data: { approved_at: DateHelper.now() },
    });
    return {
      success: true,
      message: 'User approved successfully',
    };
  }
  async updateBlockedStatus(id: string, status?: 'blocked' | 'unblocked') {
    const user = await this.prisma.user.findUnique({
      where: { id: id },
    });
    if (!user) {
      return {
        success: false,
        message: 'User not found',
      };
    }
    await this.prisma.user.update({
      where: { id: id },
      data: { is_blocked: status == 'unblocked' ? false : true },
    });
    return {
      success: true,
      message: `User ${status === 'unblocked' ? 'unblocked' : 'blocked'} successfully`,
    };
  }

  // async reject(id: string) {
  //   try {
  //     const user = await this.prisma.user.findUnique({
  //       where: { id: id },
  //     });
  //     if (!user) {
  //       return {
  //         success: false,
  //         message: 'User not found',
  //       };
  //     }
  //     await this.prisma.user.update({
  //       where: { id: id },
  //       data: { approved_at: null },
  //     });
  //     return {
  //       success: true,
  //       message: 'User rejected successfully',
  //     };
  //   } catch (error) {
  //     return {
  //       success: false,
  //       message: error.message,
  //     };
  //   }
  // }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const user = await UserRepository.updateUser(id, updateUserDto);

    if (user.success) {
      return {
        success: user.success,
        message: user.message,
      };
    } else {
      return {
        success: user.success,
        message: user.message,
      };
    }
  }

  // async remove(id: string) {
  //   try {
  //     const user = await UserRepository.deleteUser(id);
  //     return user;
  //   } catch (error) {
  //     return {
  //       success: false,
  //       message: error.message,
  //     };
  //   }
  // }
}

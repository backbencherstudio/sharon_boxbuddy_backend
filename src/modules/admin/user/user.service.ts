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
    try {
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
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  async findAll(query: GetUserQueryDto) {
    try {
      const { q, type, status, limit = 10, page = 1 } = query;
      const where_condition = {};
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

      if (status !== 'all') {
        where_condition['is_blocked'] =
          status == 'blocked' ? { equals: true } : { not: true };
      }
      const take = limit;
      const skip = (page - 1) * limit;
      const users = await this.prisma.user.findMany({
        where: {
          ...where_condition,
        },
        select: {
          id: true,
          first_name: true,
          last_name: true,
          email: true,
          phone_number: true,
          is_blocked: true,
          created_at: true,
        },
        take: take,
        skip: skip,
      });
      const total = await this.prisma.user.count({
        where: {
          ...where_condition,
        },
      });
      return {
        success: true,
        data: {
          users,
          total,
          page,
          limit,
        },
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  async findOne(id: string) {
    try {
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

      return {
        success: true,
        data: user,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  async approve(id: string) {
    try {
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
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }
  async updateBlockedStatus(id: string, status?: 'blocked' | 'unblocked') {
    try {
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
        message: 'User approved successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
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
    try {
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
    } catch (error) {
      return {
        success: false,
        message: error.message,
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

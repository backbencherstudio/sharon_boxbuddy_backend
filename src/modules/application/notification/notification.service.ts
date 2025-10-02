import { Injectable } from '@nestjs/common';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { PrismaService } from 'src/prisma/prisma.service';

export interface GetNotificationsOptions {
  page: number;
  limit: number;
  read?: boolean;
}

@Injectable()
export class NotificationService {
  constructor(private prisma: PrismaService) { }
  create(createNotificationDto: CreateNotificationDto) {
    return 'This action adds a new notification';
  }

  async findAll(userId: string, options: GetNotificationsOptions) {
    const { page, limit } = options
    const [notifications, total] = await Promise.all([
      this.prisma.notification.findMany({
        where: { receiver_id: userId },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { created_at: 'desc' }
      }),
      this.prisma.notification.count({ where: { receiver_id: userId } })
    ]);

    const totalPages = Math.ceil(total / limit);
    const hasPrevPage = page > 1;
    const hasNextPage = page < totalPages;
  
    return {
      success: true,
      message: "Notifications retrieved successfully",
      data: notifications,
      meta: {
        currentPage: page,
        limit,
        total,
        totalPages,
        hasPrevPage,
        hasNextPage
      }
    };
  }

  findOne(id: number) {
    return `This action returns a #${id} notification`;
  }

  update(id: number, updateNotificationDto: UpdateNotificationDto) {
    return `This action updates a #${id} notification`;
  }

  remove(id: number) {
    return `This action removes a #${id} notification`;
  }
}

import { BadRequestException, Injectable, Query } from '@nestjs/common';
import { CreateTravelDto } from './dto/create-travel.dto';
import { UpdateTravelDto } from './dto/update-travel.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { FindAllDto } from './dto/find-all-query.dto';
import { DateHelper } from 'src/common/helper/date.helper';
import { AnnouncementRequestDto } from './dto/announcement-request.dto';
import { MessageGateway } from 'src/modules/chat/message/message.gateway';
import appConfig from 'src/config/app.config';
import { SojebStorage } from 'src/common/lib/Disk/SojebStorage';

@Injectable()
export class TravelService {
  constructor(
    private readonly prisma: PrismaService,
    private gateway: MessageGateway,
  ) {}

  async create(createTravelDto: CreateTravelDto) {
    // check departure date is not in the past
    if (
      DateHelper.normalizeDate(createTravelDto.departure) <
      DateHelper.normalizeDate(new Date().toUTCString())
    ) {
      throw new BadRequestException('Departure date is in the past or invalid');
    }

    // check arrival date is not in the past
    if (
      DateHelper.normalizeDate(createTravelDto.arrival) <
      DateHelper.normalizeDate(new Date().toUTCString())
    ) {
      throw new BadRequestException('Arrival date is in the past or invalid');
    }

    const travel = await this.prisma.travel.create({
      data: createTravelDto,
    });

    return {
      success: true,
      message: 'travel created successfully',
      data: travel,
    };
  }

  async findAll(findAllDto: FindAllDto, userId?: string) {
    try {
      const { arrival, departure, arrival_to, departure_from } = findAllDto;
      const where = {
        publish: true,
      };

      if (userId) {
        where['user_id'] = {
          not: userId,
        };
      }

      if (arrival) {
        where['arrival'] = {
          lte: DateHelper.normalizeDateToEndOfDay(arrival),
        };
      }

      if (departure) {
        where['departure'] = {
          gte: DateHelper.normalizeDate(departure),
        };
      } else {
        where['departure'] = {
          gte: DateHelper.normalizeDate(new Date().toUTCString()),
        };
      }

      // if (arrival_to) {
      //   where['arrival_to'] = {
      //     contains: arrival_to,
      //   };
      // }

      // if (departure_from) {
      //   where['departure_from'] = {
      //     contains: departure_from,
      //   };
      // }

      if (arrival_to) {
        where['arrival_to'] = arrival_to;
      }

      if (departure_from) {
        where['departure_from'] = departure_from;
      }

      const travels = await this.prisma.travel.findMany({
        where: where,
        skip: (findAllDto.page - 1) * findAllDto.limit,
        take: findAllDto.limit,
        include: {
          user: {
            select: {
              name: true,
              avatar: true,
            },
          },
        },
        orderBy: [
          {
            departure: 'desc', // First ordering by departure date
          },
          {
            arrival: 'desc', // Then ordering by arrival date
          },
        ],
      });

      const total = await this.prisma.travel.count({ where });
      const totalPages = Math.ceil(total / findAllDto.limit);
      const hasNextPage = findAllDto.page * findAllDto.limit < total;
      const hasPreviousPage = findAllDto.page > 1;

      travels.forEach((travel) => {
        if (travel.user.avatar) {
          travel.user['avatar_url'] = SojebStorage.url(
            appConfig().storageUrl.avatar + travel.user.avatar,
          );
        }
      });

      return {
        success: true,
        message: 'travels fetched successfully',
        data: travels,
        pagination: {
          total,
          totalPages,
          currentPage: findAllDto.page,
          limit: findAllDto.limit,
          hasNextPage,
          hasPreviousPage,
        },
      };
    } catch (err) {
      return {
        success: false,
        message: 'travels fetch failed',
      };
    }
  }

  async findTravelHistory(
    query: { page?: number; limit?: number },
    userId: string,
  ) {
    try {
      const { page, limit } = query;

      const where = {
        publish: true,
        user_id: userId,
        arrival: {
          lt: new Date(),
        },
      };

      const travels = await this.prisma.travel.findMany({
        where: where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: {
            select: {
              name: true,
              avatar: true,
            },
          },
        },
        orderBy: [
          {
            departure: 'desc', // First ordering by departure date
          },
          {
            arrival: 'desc', // Then ordering by arrival date
          },
        ],
      });

      const total = await this.prisma.travel.count({ where });
      const totalPages = Math.ceil(total / limit);
      const hasNextPage = page * limit < total;
      const hasPreviousPage = page > 1;

      return {
        success: true,
        message: 'travels history fetched successfully',
        data: travels,
        pagination: {
          total,
          totalPages,
          currentPage: page,
          limit: limit,
          hasNextPage,
          hasPreviousPage,
        },
      };
    } catch (err) {
      return {
        success: false,
        message: 'travels history fetch failed',
      };
    }
  }

  async myCurrentTravels(userId: string) {
    try {
      const travels = await this.prisma.travel.findMany({
        where: {
          user_id: userId,
          departure: {
            gte: DateHelper.normalizeDate(new Date().toUTCString()),
          },
        },
        include: {
          announcement_requests: {
            include: {
              package: true,
            },
          },
        },
        orderBy: [
          {
            departure: 'asc', // First ordering by departure date
          },
          {
            arrival: 'asc', // Then ordering by arrival date
          },
        ],
      });
      return {
        success: true,
        message: 'travels fetched successfully',
        data: travels,
      };
    } catch (err) {
      console.log(err);
      return {
        success: false,
        message: 'travels fetch failed',
      };
    }
  }

  async myCurrentTravelsWithAnnounments(userId: string) {
    try {
      const travels = await this.prisma.travel.findMany({
        where: {
          user_id: userId,
          departure: {
            gte: DateHelper.normalizeDate(new Date().toUTCString()),
          },
          announcement_requests: {
            some: {}, // ✅ ensures announcement_requests is not empty
          },
        },
        include: {
          announcement_requests: {
            include: {
              package: true,
            },
          },
        },
        orderBy: [
          {
            departure: 'asc',
          },
          {
            arrival: 'asc',
          },
        ],
      });

      return {
        success: true,
        message: 'travels fetched successfully',
        data: travels,
      };
    } catch (err) {
      console.log(err);
      return {
        success: false,
        message: 'travels fetch failed',
      };
    }
  }

  async findOne(id: string) {
    try {
      const travel = await this.prisma.travel.findUnique({
        where: { id: id },
      });
      if (!travel) {
        return {
          success: false,
          message: 'travel not found',
        };
      }
      return {
        success: true,
        message: 'travel fetched successfully',
        data: travel,
      };
    } catch (err) {
      return {
        success: false,
        message: 'travel fetch failed',
      };
    }
  }

  async update(id: string, updateTravelDto: UpdateTravelDto, userId: string) {
    try {
      const travel = await this.prisma.travel.findUnique({
        where: { id: id, user_id: userId },
      });

      if (!travel) {
        return {
          success: false,
          message: 'travel not found',
        };
      }
      const updatedTravel = await this.prisma.travel.update({
        where: { id: id },
        data: updateTravelDto,
      });
      return {
        success: true,
        message: 'travel updated successfully',
        data: updatedTravel,
      };
    } catch (err) {
      return {
        success: false,
        message: 'travel update failed',
      };
    }
  }

  async remove(id: string, userId: string) {
    try {
      const travel = await this.prisma.travel.findUnique({
        where: { id: id, user_id: userId },
      });
      if (!travel) {
        return {
          success: false,
          message: 'travel not found',
        };
      }

      await this.prisma.travel.delete({
        where: { id: id },
      });
      return {
        success: true,
        message: 'travel deleted successfully',
      };
    } catch (err) {
      return {
        success: false,
        message: 'travel deletion failed',
      };
    }
  }

  async updateRequest(
    id: string,
    userId: string,
    announcementRequestDto: AnnouncementRequestDto,
  ) {
    try {
      if (
        (announcementRequestDto.is_accepted === undefined ||
          announcementRequestDto.is_accepted === null) &&
        (announcementRequestDto.is_refused === undefined ||
          announcementRequestDto.is_refused === null)
      ) {
        return {
          success: false,
          message: 'Invalid request',
        };
      }

      // Step 1: Find the AnnouncementRequest by ID
      const request = await this.prisma.announcementRequest.findUnique({
        where: {
          id: id,
          is_accepted: false,
          is_refused: false,
          is_processed: false,
        },
        include: {
          travel: true, // Include the associated travel to check user_id
          booking: {
            select: {
              id: true,
              amount: true,
              owner_id: true,
              owner: {
                select: {
                  first_name: true,
                },
              },
              traveller_id: true,
              traveller: {
                select: {
                  first_name: true,
                },
              },
            },
          },
          package: {
            select: {
              owner_id: true,
            },
          },
        },
      });

      // Check if the announcement request exists
      if (!request) {
        return {
          success: false,
          message: 'Announcement request not found',
        };
      }

      // Step 2: Check if the associated travel has the correct user_id
      if (request.travel.user_id !== userId) {
        return {
          success: false,
          message: 'User is not authorized for this travel',
        };
      }

      const data: any = {
        is_processed: true,
      };

      if (
        announcementRequestDto.is_accepted === true ||
        announcementRequestDto.is_accepted === false
      ) {
        data['is_accepted'] = announcementRequestDto.is_accepted;
        if (announcementRequestDto.is_accepted === true)
          data['is_refused'] = false;
      } else if (
        announcementRequestDto.is_refused === true ||
        announcementRequestDto.is_refused === false
      ) {
        data['is_refused'] = announcementRequestDto.is_refused;
        if (announcementRequestDto.is_refused === true)
          data['is_accepted'] = false;
      }

      // Step 3: Proceed with accepting the request and updating the travel data
      await this.prisma.announcementRequest.update({
        where: { id },
        data,
      });

      // if accepted then confirm booking, update conversation, notificaton
      if (announcementRequestDto.is_accepted === true) {
        await this.prisma.booking.update({
          where: {
            id: request.booking_id,
          },
          data: {
            status: 'pick_up',
            confirmed: true,
          },
        });
        // conversation
        const conversations =
          await this.prisma.conversation.updateManyAndReturn({
            where: {
              travel_id: request.travel_id,
              package_id: request.package_id,
            },
            data: {
              notification_type: 'accepted',
            },
            include: {
              package: {
                select: {
                  owner_id: true,
                },
              },
              travel: {
                select: {
                  user_id: true,
                },
              },
            },
          });

        const notifications =
          await this.prisma.notification.createManyAndReturn({
            data: [
              {
                notification_message: `Your booking has been accepted by ${request.booking.traveller.first_name}`,
                notification_type: 'accepted',
                receiver_id: request.booking.owner_id,
                owner_id: request.booking.owner_id,
                traveller_id: request.booking.traveller_id,
                conversation_id: conversations?.[0]?.id,
                booking_id: request.booking_id,
              },
              {
                notification_message: `You accepted the booking request from ${request.booking.owner.first_name}. Get ready for the package handover.`,
                notification_type: 'accepted',
                receiver_id: request.booking.traveller_id,
                owner_id: request.booking.owner_id, 
                traveller_id: request.booking.traveller_id,
                conversation_id: conversations?.[0]?.id,
                booking_id: request.booking_id,
              },
            ],
          });

        // sending notification for notification and conversation
        // notification
        notifications.forEach((notification) => {
          this.gateway.server
            .to(notification.receiver_id)
            .emit('notification', notification);
        });

        // conversation
        conversations.forEach((conv) => {
          // sending to package owner
          this.gateway.server
            .to(conv.package.owner_id)
            .emit('conversation-notification-update', {
              id: conv.id,
              notification_type: conv.notification_type,
            });
        });
      } else if (announcementRequestDto.is_refused === true) {
        // update booking, conversation, wallet, create notification for both
        // wallet
        await this.prisma.wallet.update({
          where: {
            user_id: request.booking.owner_id,
          },
          data: {
            balance: {
              increment: request.booking.amount,
            },
          },
        });

        await this.prisma.booking.update({
          where: {
            id: request.booking_id,
          },
          data: {
            status: 'declined',
            payment_status: 'refunded',
          },
        });

        // conversation
        const conversations =
          await this.prisma.conversation.updateManyAndReturn({
            where: {
              travel_id: request.travel_id,
              package_id: request.package_id,
            },
            data: {
              notification_type: 'declined',
            },
            include: {
              package: {
                select: {
                  owner_id: true,
                },
              },
              travel: {
                select: {
                  user_id: true,
                },
              },
            },
          });

        // notification
        const notifications =
          await this.prisma.notification.createManyAndReturn({
            data: [
              {
                notification_message: `Your booking has been declined by ${request.booking.traveller.first_name}. You have been automatically refunded.`,
                notification_type: 'declined',
                receiver_id: request.booking.owner_id,
                owner_id: request.booking.owner_id,
                traveller_id: request.booking.traveller_id,
                conversation_id: conversations?.[0]?.id,
                booking_id: request.booking_id,
              },
              {
                notification_message: `You declined the booking request from ${request.booking.owner.first_name}. The sender has been refunded.`,
                notification_type: 'declined',
                receiver_id: request.booking.traveller_id,
                owner_id: request.booking.owner_id,
                traveller_id: request.booking.traveller_id,
                conversation_id: conversations?.[0]?.id,
                booking_id: request.booking_id,
              },
            ],
          });

        // sending notification for notification and conversation
        // notification
        notifications.forEach((notification) => {
          this.gateway.server
            .to(notification.receiver_id)
            .emit('notification', notification);
        });

        // conversation
        conversations.forEach((conv) => {
          // sending to package owner
          this.gateway.server
            .to(conv.package.owner_id)
            .emit('conversation-notification-update', {
              id: conv.id,
              notification_type: conv.notification_type,
            });
        });
      }

      return {
        success: true,
        message: 'Travel updated successfully',
      };
    } catch (err) {
      console.error(err);
      return {
        success: false,
        message: 'Travel update failed',
      };
    }
  }
}

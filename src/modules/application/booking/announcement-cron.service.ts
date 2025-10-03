import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { MessageGateway } from 'src/modules/chat/message/message.gateway';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AnnouncementCronService {
  private readonly logger = new Logger(AnnouncementCronService.name);

  constructor(private prisma: PrismaService, private gateway: MessageGateway) { }

  @Cron(CronExpression.EVERY_5_SECONDS) // CronExpression.EVERY_30_MINUTES // runs every hour
  async handleCron() {
    this.logger.log('Cron job started: Checking old AnnouncementRequests');

    const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);

    const requests = await this.prisma.announcementRequest.findMany({
      where: {
        is_accepted: false,
        is_refused: false,
        is_processed: false, // only unprocessed ones
        created_at: { lt: twelveHoursAgo }
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
              }
            },
            traveller_id: true,
            traveller: {
              select: {
                first_name: true,
              }
            },
          }
        },
        package: {
          select: {
            owner_id: true,
          }
        }
      },
    });

    for (const request of requests) {
      // Example: process booking if exists
      // if (req.booking_id) {
      //   // Your booking logic here
      //   this.logger.log(`Processing booking: ${req.booking_id}`);
      //   // await this.bookingService.updateStatus(req.booking_id, 'expired');
      // }

      await this.prisma.wallet.update({
        where: {
          user_id: request.booking.owner_id,
        },
        data: {
          balance: {
            increment: request.booking.amount
          }
        }
      })


      const pickUpTime = new Date(request.travel.departure)
      const now = new Date()
      const hoursUntilPickup = (pickUpTime.getTime() - now.getTime()) / (1000 * 60 * 60)

      await this.prisma.booking.update({
        where: {
          id: request.booking_id
        },
        data: {
          status: 'expired',
          payment_status: 'refunded',
          refund_details: {
            sender_refund: Number(request.booking.amount),
            traveler_amount: 0,
            platform_amount: 0,
            cancellation_timeframe: `${Math.round(hoursUntilPickup)} hours before pick-up`
          }
        }
      })


      // conversation
      const conversations = await this.prisma.conversation.updateManyAndReturn({
        where: {
          travel_id: request.travel_id,
          package_id: request.package_id,
        },
        data: {
          notification_type: 'expired'
        },
        include: {
          package: {
            select: {
              owner_id: true,
            }
          },
          travel: {
            select: {
              user_id: true
            }
          }
        }
      })

      // notification
      const notifications = await this.prisma.notification.createManyAndReturn({
        data: [
          {
            notification_message: `Your booking request expired. ${request.booking.traveller.first_name} did not confirm within 12h. You have been refunded.`,
            notification_type: 'expired',
            receiver_id: request.booking.owner_id
          },
          {
            notification_message: `You missed ${request.booking.owner.first_name}’s booking request. It expired after 12h.`,
            notification_type: 'expired',
            receiver_id: request.booking.traveller_id
          }
        ]
      })

      // Mark as processed
      await this.prisma.announcementRequest.update({
        where: { id: request.id },
        data: { is_processed: true }
      });

      // sending notification for notification and conversation
      // notification
      notifications.forEach(notification => {
        this.gateway.server.to(notification.receiver_id).emit("notification", notification)
      });

      // conversation
      conversations.forEach(conv => {
        // sending to package owner
        this.gateway.server.to(conv.package.owner_id).emit("conversation-notification-update", {
          id: conv.id,
          notification_type: conv.notification_type
        })
      })



    }

    this.logger.log(`Processed ${requests.length} requests`);
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { MessageGateway } from 'src/modules/chat/message/message.gateway';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AnnouncementCronService {
  private readonly logger = new Logger(AnnouncementCronService.name);

  constructor(
    private prisma: PrismaService,
    private gateway: MessageGateway,
  ) {}

  @Cron(CronExpression.EVERY_10_MINUTES) // CronExpression.EVERY_30_MINUTES // runs every hour
  async handleCron() {
    this.logger.log('Cron job started: Checking old AnnouncementRequests');

    const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);

    const requests = await this.prisma.announcementRequest.findMany({
      where: {
        is_accepted: false,
        is_refused: false,
        is_processed: false, // only unprocessed ones
        created_at: { lt: twelveHoursAgo },
        booking: {
          payment_status: 'completed',
        },
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
            payment_status: true,
          },
        },
        package: {
          select: {
            owner_id: true,
          },
        },
      },
    });

    for (const request of requests) {
      // Example: process booking if exists
      // if (request.booking_id) {
      //   // Your booking logic here
      //   this.logger.log(`Processing booking: ${request.booking_id},  payment status: ${request.booking.payment_status}`);
      //   // await this.bookingService.updateStatus(req.booking_id, 'expired');
      // }

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

      const pickUpTime = new Date(request.travel.departure);
      const now = new Date();
      const hoursUntilPickup =
        (pickUpTime.getTime() - now.getTime()) / (1000 * 60 * 60);

      await this.prisma.booking.update({
        where: {
          id: request.booking_id,
        },
        data: {
          status: 'expired',
          payment_status: 'refunded',
          refund_details: {
            sender_refund: Number(request.booking.amount),
            traveler_amount: 0,
            platform_amount: 0,
            cancellation_timeframe: `${Math.round(hoursUntilPickup)} hours before pick-up`,
          },
        },
      });

      // conversation
      const conversations = await this.prisma.conversation.updateManyAndReturn({
        where: {
          travel_id: request.travel_id,
          package_id: request.package_id,
        },
        data: {
          notification_type: 'expired',
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
      const notifications = await this.prisma.notification.createManyAndReturn({
        data: [
          {
            notification_message: `Your booking request expired. ${request.booking.traveller.first_name} did not confirm within 12h. You have been refunded.`,
            notification_type: 'expired',
            receiver_id: request.booking.owner_id,
            owner_id: request.booking.owner_id,
            traveller_id: request.booking.traveller_id,
            conversation_id: conversations?.[0]?.id,
            booking_id: request.booking_id,
          },
          {
            notification_message: `You missed ${request.booking.owner.first_name}’s booking request. It expired after 12h.`,
            notification_type: 'expired',
            receiver_id: request.booking.traveller_id,
            owner_id: request.booking.owner_id,
            traveller_id: request.booking.traveller_id,
            conversation_id: conversations?.[0]?.id,
            booking_id: request.booking_id,
          },
        ],
      });

      // Mark as processed
      await this.prisma.announcementRequest.update({
        where: { id: request.id },
        data: { is_processed: true },
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

    this.logger.log(`Processed ${requests.length} requests`);
  }

  // write a cron job that runs every 10 minutes to delete unverified users older than 24 hours
  @Cron(CronExpression.EVERY_MINUTE)
  async handleDeleteUnverifiedUsers() {
    this.logger.log('Cron job started: Deleting unverified users');

    const unverifiedUsers = await this.prisma.user.findMany({
      where: {
        email_verified_at: null,
        created_at: { lt: new Date(Date.now() - 10 * 60 * 1000) },
      },
    });

    // delete all the conversation which does not have user 
    // First, find conversations to delete
    const conversationsToDelete = await this.prisma.conversation.findMany({
      where: {
        OR: [
          { creator: null },
          { participant: null },
          { package: null },
          { travel: null },
        ],
      },
      select: { id: true },
    });

    this.logger.log(`Found ${conversationsToDelete.length} conversations to delete`);

    if (conversationsToDelete.length > 0) {
      const conversationIds = conversationsToDelete.map((c) => c.id);

      // Get all messages in these conversations
      const messages = await this.prisma.message.findMany({
        where: {
          conversation_id: { in: conversationIds },
        },
        select: { id: true },
      });
      this.logger.log(`Found ${messages.length} messages to delete`);
      const messageIds = messages.map((m) => m.id);

      // Delete attachments first (they block message deletion)
      if (messageIds.length > 0) {
        await this.prisma.attachment.deleteMany({
          where: {
            message_id: { in: messageIds },
          },
        });
      }

      // Delete conversations (this will cascade delete messages due to onDelete: Cascade)
      await this.prisma.conversation.deleteMany({
        where: {
          id: { in: conversationIds },
        },
      });
      this.logger.log(`Deleted ${conversationsToDelete.length} conversations`);
    }

    this.logger.log(`Found ${unverifiedUsers.length} unverified users`);
    for (const user of unverifiedUsers) {
      try {


        // Use a transaction to ensure all deletions succeed or none do
        await this.prisma.$transaction(async (tx) => {
          // Get all travels and packages for this user
          const travels = await tx.travel.findMany({
            where: { user_id: user.id },
            select: { id: true },
          });
          const packages = await tx.package.findMany({
            where: { owner_id: user.id },
            select: { id: true },
          });

          const travelIds = travels.map((t) => t.id);
          const packageIds = packages.map((p) => p.id);

          // Get bookings related to these travels and packages
          const bookingConditions = [];
          if (travelIds.length > 0) {
            bookingConditions.push({ travel_id: { in: travelIds } });
          }
          if (packageIds.length > 0) {
            bookingConditions.push({ package_id: { in: packageIds } });
          }

          let bookingIds: string[] = [];
          if (bookingConditions.length > 0) {
            const bookings = await tx.booking.findMany({
              where: { OR: bookingConditions },
              select: { id: true },
            });
            bookingIds = bookings.map((b) => b.id);
          }

          // Delete in order: child records first, then parent records
          // 1. Delete reviews (related to bookings)
          if (bookingIds.length > 0) {
            await tx.review.deleteMany({
              where: { booking_id: { in: bookingIds } },
            });
          }

          // 2. Delete bookings (related to travels and packages)
          if (bookingIds.length > 0) {
            await tx.booking.deleteMany({
              where: { id: { in: bookingIds } },
            });
          }

          // 3. Delete reports (related to travels and packages)
          const reportConditions = [];
          if (travelIds.length > 0) {
            reportConditions.push({ travel_id: { in: travelIds } });
          }
          if (packageIds.length > 0) {
            reportConditions.push({ package_id: { in: packageIds } });
          }
          if (reportConditions.length > 0) {
            await tx.report.deleteMany({
              where: { OR: reportConditions },
            });
          }

          // 4. Delete travels (AnnouncementRequests and Conversations have cascade/setNull, so they're handled automatically)
          if (travelIds.length > 0) {
            await tx.travel.deleteMany({
              where: { id: { in: travelIds } },
            });
          }

          // 5. Delete packages (AnnouncementRequests and Conversations have cascade/setNull, so they're handled automatically)
          if (packageIds.length > 0) {
            await tx.package.deleteMany({
              where: { id: { in: packageIds } },
            });
          }

          // 6. Delete the user
          await tx.user.delete({
            where: { id: user.id },
          });
        });

        this.logger.log(`Successfully deleted user ${user.id}`);
      } catch (error) {
        this.logger.error(
          `Failed to delete user ${user.id}: ${error.message}`,
          error.stack,
        );
      }
    }
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AnnouncementCronService {
  private readonly logger = new Logger(AnnouncementCronService.name);

  constructor(private prisma: PrismaService) {}

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
      }
    });

    for (const req of requests) {
      // Example: process booking if exists
      if (req.booking_id) {
        // Your booking logic here
        this.logger.log(`Processing booking: ${req.booking_id}`);
        // await this.bookingService.updateStatus(req.booking_id, 'expired');
      }

      // Mark as processed
    //   await this.prisma.announcementRequest.update({
    //     where: { id: req.id },
    //     data: { is_processed: true }
    //   });
    }

    this.logger.log(`Processed ${requests.length} requests`);
  }
}

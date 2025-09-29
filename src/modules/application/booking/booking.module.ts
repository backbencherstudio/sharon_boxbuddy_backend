import { Module } from '@nestjs/common';
import { BookingService } from './booking.service';
import { BookingController } from './booking.controller';
import { AnnouncementCronService } from './announcement-cron.service';

@Module({
  controllers: [BookingController],
  providers: [BookingService, AnnouncementCronService],
})
export class BookingModule {}

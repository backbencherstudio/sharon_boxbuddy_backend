import { Module } from '@nestjs/common';
import { NotificationModule } from './notification/notification.module';
import { ContactModule } from './contact/contact.module';
import { FaqModule } from './faq/faq.module';
import { PackageModule } from './package/package.module';
import { TravelModule } from './travel/travel.module';
import { BookingModule } from './booking/booking.module';
import { ReviewsModule } from './reviews/reviews.module';
import { WalletModule } from './wallet/wallet.module';

@Module({
  imports: [NotificationModule, ContactModule, FaqModule, PackageModule, TravelModule, BookingModule, ReviewsModule, WalletModule],
})
export class ApplicationModule {}

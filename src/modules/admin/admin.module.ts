import { Module } from '@nestjs/common';
import { FaqModule } from './faq/faq.module';
import { ContactModule } from './contact/contact.module';
import { WebsiteInfoModule } from './website-info/website-info.module';
import { PaymentTransactionModule } from './payment-transaction/payment-transaction.module';
import { UserModule } from './user/user.module';
import { NotificationModule } from './notification/notification.module';
import { PlatformWalletModule } from './platform-wallet/platform-wallet.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { BookingModule } from './booking/booking.module';
import { TravelModule } from './travel/travel.module';
import { PackageModule } from './package/package.module';

@Module({
  imports: [
    FaqModule,
    ContactModule,
    WebsiteInfoModule,
    PaymentTransactionModule,
    UserModule,
    NotificationModule,
    PlatformWalletModule,
    AnalyticsModule,
    BookingModule,
    TravelModule,
    PackageModule,
  ],
})
export class AdminModule {}

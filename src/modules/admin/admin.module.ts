import { Module } from '@nestjs/common';
import { FaqModule } from './faq/faq.module';
import { ContactModule } from './contact/contact.module';
import { WebsiteInfoModule } from './website-info/website-info.module';
import { TransactionModule } from './transaction/transaction.module';
import { UserModule } from './user/user.module';
import { NotificationModule } from './notification/notification.module';
import { PlatformWalletModule } from './platform-wallet/platform-wallet.module';
import { OverviewModule } from './overview/overview.module';
import { BookingModule } from './booking/booking.module';
import { TravelModule } from './travel/travel.module';
import { PackageModule } from './package/package.module';

@Module({
  imports: [
    FaqModule,
    ContactModule,
    WebsiteInfoModule,
    TransactionModule,
    UserModule,
    NotificationModule,
    PlatformWalletModule,
    OverviewModule,
    BookingModule,
    TravelModule,
    PackageModule,
  ],
})
export class AdminModule {}

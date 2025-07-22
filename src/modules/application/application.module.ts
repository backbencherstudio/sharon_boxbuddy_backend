import { Module } from '@nestjs/common';
import { NotificationModule } from './notification/notification.module';
import { ContactModule } from './contact/contact.module';
import { FaqModule } from './faq/faq.module';
import { PackageModule } from './package/package.module';

@Module({
  imports: [NotificationModule, ContactModule, FaqModule, PackageModule],
})
export class ApplicationModule {}

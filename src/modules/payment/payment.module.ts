import { Module } from '@nestjs/common';
import { StripeModule } from './stripe/stripe.module';
import { WalletModule } from '../application/wallet/wallet.module';

@Module({
  imports: [StripeModule, WalletModule],
})
export class PaymentModule {}

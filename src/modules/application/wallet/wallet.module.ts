import { Module } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { WalletController } from './wallet.controller';
import { WalletWebhookController } from './wallet.webhook.controller';
import { ConfigModule } from '@nestjs/config';
import { WalletConfig } from './wallet.config';
import Stripe from 'stripe';
import { PrismaModule } from 'src/prisma/prisma.module';
import { PaymentAccountService } from './payment.service';

@Module({
  imports: [PrismaModule, ConfigModule],
  controllers: [WalletController, WalletWebhookController],
  providers: [
    WalletConfig,
    {
      provide: 'STRIPE_CLIENT',
      useFactory: (config: WalletConfig) => {
        return new Stripe(process.env.STRIPE_SECRET_KEY, {
          apiVersion: '2025-03-31.basil',
        });
      },
      inject: [WalletConfig],
    },
    WalletService,
    PaymentAccountService,
  ],
  exports: [WalletService],
})
export class WalletModule {}

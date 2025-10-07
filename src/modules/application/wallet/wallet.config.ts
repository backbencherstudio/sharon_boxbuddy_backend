import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import Stripe from 'stripe';

@Injectable()
export class WalletConfig implements OnModuleInit {
  private readonly logger = new Logger(WalletConfig.name);
  public platformAccountId: string;
  public currency: string = process.env.CURRENCY || 'EUR';
  public minDeposit: number = 5.0;
  public minWithdraw: number = 10.0;
  public centralWalletId: string = process.env.CENTRAL_WALLET_USER_ID;
  public deposit_return_url: string = process.env.DEPOSIT_REDIRECT_URL;
  public paymentMethods: string[] = process.env.PAYMENT_METHODS ? process.env.PAYMENT_METHODS.split(',') : ['card'];
  public readonly stripeReturnUrl: string = process.env.STRIPE_RETURN_URL;
  public readonly stripeConnectRefreshUrl: string = process.env.STRIPE_CONNECT_REFRESH_URL;

  private stripe: Stripe;

  constructor() {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not defined in environment variables');
    }

    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-03-31.basil',
      typescript: true,
    });
  }

  async onModuleInit() {
    try {
      const account = await this.stripe.accounts.retrieve();
      this.platformAccountId = account.id;
      this.logger.log(`Stripe Platform Account ID: ${this.platformAccountId}`);
      
      // Validate currency support
      if (!account.default_currency?.includes(this.currency)) {
        this.logger.warn(
          `Currency ${this.currency} not supported by Stripe account.`,
        );
      }
    } catch (error) {
      this.logger.error('Failed to retrieve Stripe account', error.stack);
      throw new Error('Could not initialize Stripe configuration');
    }
  }
}
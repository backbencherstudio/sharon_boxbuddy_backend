import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { WalletConfig } from './wallet.config';
import Stripe from 'stripe';
import { DepositDto } from './dto/deposit.dto';
import { WithdrawDto } from './dto/withdraw.dto';
import { SpendDto } from './dto/spend.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { PaymentAccountService } from './payment.service';
import { StripePayment } from 'src/common/lib/Payment/stripe/StripePayment';

@Injectable()
export class WalletService implements OnModuleInit {
  private readonly logger = new Logger(WalletService.name);

  constructor(
    private prisma: PrismaService,
    private config: WalletConfig,
    private paymentAccountService: PaymentAccountService,
    @Inject('STRIPE_CLIENT') private stripe: Stripe,
  ) {}

  async onModuleInit() {
    await this.ensureCentralWalletExists();
  }

  private async ensureCentralWalletExists() {
    const centralWallet = await this.prisma.wallet.findUnique({
      where: { id: this.config.centralWalletId },
    });

    if (!centralWallet) {
      await this.prisma.wallet.create({
        data: {
          // user_id: 'cmbpx5ocz0001vwowqi9dakfd',
          balance: 0,
          currency: this.config.currency,
        },
      });
      this.logger.log('Central wallet created');
    }
  }

  async createVerificationSession(userId: string) {
    try {
      const session = await this.stripe.identity.verificationSessions.create({
        type: 'document', // or 'phone' depending on what type of verification you need
        metadata: {
          user_id: userId, // Your user ID (can be passed dynamically)
        },
      });
      return session;
    } catch (error) {
      throw new Error(`Error creating verification session: ${error.message}`);
    }
  }

  async createUserWallet(userId: string) {
    return this.prisma.wallet.create({
      data: {
        user_id: userId,
        balance: 0,
        currency: this.config.currency,
      },
    });
  }

  async getWallet(userId: string) {
    return this.prisma.wallet.findUniqueOrThrow({
      where: { user_id: userId },
    });
  }

  async connectStripeAccount(userId: string) {
    try {
      // const accounts = await this.paymentAccountService.getAccounts(userId,'stripe');
      // if (accounts.length > 0) {
      //   return {
      //     sucess: true,
      //     message: 'Account already exists',
      //     url: '',
      //   }
      // }

      const user = await this.prisma.user.findUniqueOrThrow({
        where: { id: userId },
      });

      const account = await this.stripe.accounts.create({
        type: 'express',
        country: 'US',
        email: user.email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
      });

      const accountLink = await this.stripe.accountLinks.create({
        account: account.id,
        refresh_url: this.config.stripeReturnUrl, // URL to redirect if user needs to reauthenticate
        return_url: this.config.stripeReturnUrl, // URL after successful onboarding
        type: 'account_onboarding',
      });

      await this.paymentAccountService.createAccount(
        userId,
        'stripe',
        account.id,
        { accountType: 'express' },
      );

      return {
        sucess: true,
        message:
          'For Stripe account to be connected successfully, please click the link below',
        url: accountLink.url,
      };
    } catch (error) {
      console.log(error);
      throw new BadRequestException(error.message);
    }
  }

  async getStripeCustomerId(userId: string): Promise<string> {
    const accounts = await this.paymentAccountService.getAccounts(
      userId,
      'stripe',
    );
    const customerAccount = accounts.find(
      (a) => (a.metadata as { type?: string })?.type === 'customer',
    );

    if (customerAccount) {
      return customerAccount.account_id;
    }

    // Create new Stripe customer if none exists
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
    });

    const customer = await this.stripe.customers.create({
      email: user.email,
      metadata: { userId },
    });

    await this.paymentAccountService.createAccount(
      userId,
      'stripe',
      customer.id,
      { type: 'customer' },
    );

    return customer.id;
  }

  async depositFunds(dto: DepositDto) {
    const wallet = await this.getWallet(dto.userId);

    if (dto.amount < this.config.minDeposit) {
      throw new BadRequestException(
        `Minimum deposit amount is ${this.config.minDeposit} ${this.config.currency}`,
      );
    }

    // Create transaction record
    const transaction = await this.prisma.walletTransaction.create({
      data: {
        wallet_id: wallet.id,
        type: 'DEPOSIT',
        amount: dto.amount,
        status: 'PENDING',
      },
    });

    // Create Stripe PaymentIntent
    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: Math.round(dto.amount * 100),
      currency: this.config.currency,
      metadata: {
        userId: dto.userId,
        walletId: wallet.id,
        transactionId: transaction.id,
        amount: dto.amount,
      },
      payment_method: dto.paymentMethodId,
      confirm: true,
      return_url: this.config.deposit_return_url, // Your return URL
      payment_method_types: this.config.paymentMethods,
    });

    // Update transaction with Stripe ID
    await this.prisma.walletTransaction.update({
      where: { id: transaction.id },
      data: { stripe_id: paymentIntent.id },
    });

    return {
      clientSecret: paymentIntent.client_secret,
      transactionId: transaction.id,
    };
  }

  async holdFunds(dto: SpendDto) {
    return this.prisma.$transaction(async (tx) => {
      const userWallet = await tx.wallet.findUniqueOrThrow({
        where: { user_id: dto.userId },
      });

      if (userWallet.balance < dto.amount) {
        throw new BadRequestException('Insufficient funds');
      }

      const centralWallet = await tx.wallet.findUniqueOrThrow({
        where: { id: this.config.centralWalletId },
      });

      // Deduct from user wallet
      await tx.wallet.update({
        where: { id: userWallet.id },
        data: { balance: { decrement: dto.amount } },
      });

      // Add to central wallet (hold)
      await tx.wallet.update({
        where: { id: centralWallet.id },
        data: { balance: { increment: dto.amount } },
      });

      // Create transactions
      await tx.walletTransaction.createMany({
        data: [
          {
            wallet_id: userWallet.id,
            type: 'SPEND',
            amount: dto.amount,
            status: 'COMPLETED',
            metadata: { bookingId: dto.bookingId },
          },
          {
            wallet_id: centralWallet.id,
            type: 'HOLD',
            amount: dto.amount,
            status: 'COMPLETED',
            metadata: { bookingId: dto.bookingId, userId: dto.userId },
          },
        ],
      });

      return { success: true };
    });
  }

  async releaseFunds(bookingId: string, providerId: string, amount: number) {
    return this.prisma.$transaction(async (tx) => {
      const providerWallet = await tx.wallet.findUniqueOrThrow({
        where: { user_id: providerId },
      });

      const centralWallet = await tx.wallet.findUniqueOrThrow({
        where: { id: this.config.centralWalletId },
      });

      if (centralWallet.balance < amount) {
        throw new BadRequestException('Insufficient funds in central wallet');
      }

      // Deduct from central wallet
      await tx.wallet.update({
        where: { id: centralWallet.id },
        data: { balance: { decrement: amount } },
      });

      // Add to provider wallet
      await tx.wallet.update({
        where: { id: providerWallet.id },
        data: { balance: { increment: amount } },
      });

      // Create transactions
      await tx.walletTransaction.createMany({
        data: [
          {
            wallet_id: centralWallet.id,
            type: 'RELEASE',
            amount: amount,
            status: 'COMPLETED',
            metadata: { bookingId },
          },
          {
            wallet_id: providerWallet.id,
            type: 'DEPOSIT',
            amount: amount,
            status: 'COMPLETED',
            metadata: { bookingId },
          },
        ],
      });

      return { success: true };
    });
  }

  // async withdrawFunds(dto: WithdrawDto) {
  //   return this.prisma.$transaction(async (tx) => {
  //     const wallet = await tx.wallet.findUniqueOrThrow({
  //       where: { user_id: dto.userId },
  //     });

  //     if (dto.amount < this.config.minWithdraw) {
  //       throw new BadRequestException(
  //         `Minimum withdrawal amount is ${this.config.minWithdraw} ${this.config.currency}`,
  //       );
  //     }

  //     if (wallet.balance < dto.amount) {
  //       throw new BadRequestException('Insufficient funds');
  //     }

  //     // Create transaction record
  //     const transaction = await tx.walletTransaction.create({
  //       data: {
  //         wallet_id: wallet.id,
  //         type: 'WITHDRAW',
  //         amount: dto.amount,
  //         status: 'PENDING',
  //       },
  //     });

  //     // Deduct from wallet immediately
  //     await tx.wallet.update({
  //       where: { id: wallet.id },
  //       data: { balance: { decrement: dto.amount } },
  //     });

  //     try {
  //       // Initiate Stripe payout
  //       const payout = await this.stripe.payouts.create({
  //         amount: Math.round(dto.amount * 100),
  //         currency: this.config.currency,
  //         destination: dto.destinationAccountId,
  //         metadata: {
  //           userId: dto.userId,
  //           walletId: wallet.id,
  //           transactionId: transaction.id,
  //           amount: dto.amount,
  //         },
  //       });

  //       // Update transaction with Stripe ID
  //       await tx.walletTransaction.update({
  //         where: { id: transaction.id },
  //         data: { stripe_id: payout.id },
  //       });

  //       return { payoutId: payout.id, transactionId: transaction.id };
  //     } catch (error) {
  //       console.log(error)
  //       // Revert balance if payout fails
  //       await tx.wallet.update({
  //         where: { id: wallet.id },
  //         data: { balance: { increment: dto.amount } },
  //       });

  //       // Update transaction status
  //       await tx.walletTransaction.update({
  //         where: { id: transaction.id },
  //         data: { status: 'FAILED', metadata: { BadRequestException: error.message } },
  //       });

  //       throw BadRequestException;
  //     }
  //   });
  // }

  async withdrawFunds(dto: WithdrawDto) {
    return this.prisma.$transaction(async (tx) => {
      // Find wallet using the provided user ID
      const wallet = await tx.wallet.findUniqueOrThrow({
        where: { user_id: dto.userId },
      });

      // Validate minimum withdrawal amount
      if (dto.amount < this.config.minWithdraw) {
        throw new BadRequestException(
          `Minimum withdrawal amount is ${this.config.minWithdraw} ${this.config.currency}`,
        );
      }

      // Check for sufficient funds in the wallet
      if (wallet.balance < dto.amount) {
        throw new BadRequestException('Insufficient funds');
      }

      // Create transaction record (withdrawing amount)
      const transaction = await tx.walletTransaction.create({
        data: {
          wallet_id: wallet.id,
          type: 'WITHDRAW',
          amount: dto.amount,
          status: 'PENDING',
        },
      });

      // Deduct from wallet balance immediately
      await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: { decrement: dto.amount } },
      });

      try {
        // const transfer = await this.stripe.transfers.create({
        //   amount: Math.round(dto.amount * 100),
        //   currency: this.config.currency,
        //   destination: dto.destinationAccountId,
        //   metadata: {
        //     userId: dto.userId,
        //     walletId: wallet.id,
        //     transactionId: transaction.id,
        //     amount: dto.amount,
        //   },
        // });

        await this.stripe.transfers.create({
          amount: dto.amount * 100,
          currency: 'usd',
          destination: dto.destinationAccountId,
        });

        // Initiate Stripe payout (convert amount to cents)
        const payout = await this.stripe.payouts.create(
          {
            amount: Math.round(dto.amount * 100), // Convert dollars to cents
            currency: this.config.currency,
            // destination: dto.destinationAccountId,
            metadata: {
              userId: dto.userId,
              walletId: wallet.id,
              transactionId: transaction.id,
              amount: dto.amount,
            },
          },
          {
            stripeAccount: dto.destinationAccountId,
          },
        );

        // const payout = await StripePayment.createPayout(dto.destinationAccountId, dto.amount, 'usd')

        // Update transaction with Stripe payout ID
        await tx.walletTransaction.update({
          where: { id: transaction.id },
          data: { stripe_id: payout.id, status: 'COMPLETED' }, // Mark as completed if payout is successful
        });

        // Return payout and transaction details
        return { payoutId: payout.id, transactionId: transaction.id };
      } catch (error) {
        console.log(error); // Log error for debugging purposes

        // Revert wallet balance increment if payout fails
        await tx.wallet.update({
          where: { id: wallet.id },
          data: { balance: { increment: dto.amount } },
        });

        // Update transaction with failure status and error message
        await tx.walletTransaction.update({
          where: { id: transaction.id },
          data: { status: 'FAILED', metadata: { error: error.message } }, // Store error message in metadata
        });

        // Throw BadRequestException with error message
        throw new BadRequestException(`Withdrawal failed: ${error.message}`);
      }
    });
  }

  async platformWithdraw(amount: number, destinationAccountId: string) {
    return this.prisma.$transaction(async (tx) => {
      const centralWallet = await tx.wallet.findUniqueOrThrow({
        where: { id: this.config.centralWalletId },
      });

      if (centralWallet.balance < amount) {
        throw new BadRequestException('Insufficient funds in central wallet');
      }

      // Create transaction record
      const transaction = await tx.walletTransaction.create({
        data: {
          wallet_id: centralWallet.id,
          type: 'WITHDRAW',
          amount: amount,
          status: 'PENDING',
        },
      });

      // Deduct from central wallet
      await tx.wallet.update({
        where: { id: centralWallet.id },
        data: { balance: { decrement: amount } },
      });

      try {
        // Initiate Stripe payout from platform account
        const payout = await this.stripe.payouts.create(
          {
            amount: Math.round(amount * 100),
            currency: this.config.currency,
            destination: destinationAccountId,
            metadata: {
              walletId: centralWallet.id,
              transactionId: transaction.id,
              amount: amount,
            },
          },
          {
            stripeAccount: this.config.platformAccountId,
          },
        );

        // Update transaction with Stripe ID
        await tx.walletTransaction.update({
          where: { id: transaction.id },
          data: { stripe_id: payout.id },
        });

        return { payoutId: payout.id, transactionId: transaction.id };
      } catch (BadRequestException) {
        // Revert balance if payout fails
        await tx.wallet.update({
          where: { id: centralWallet.id },
          data: { balance: { increment: amount } },
        });

        // Update transaction status
        await tx.walletTransaction.update({
          where: { id: transaction.id },
          data: {
            status: 'FAILED',
            metadata: { BadRequestException: BadRequestException.message },
          },
        });

        throw BadRequestException;
      }
    });
  }

  async refundTransaction(transactionId: string) {
    return this.prisma.$transaction(async (tx) => {
      const transaction = await tx.walletTransaction.findUniqueOrThrow({
        where: { id: transactionId },
        include: { wallet: true },
      });

      if (transaction.type !== 'SPEND') {
        throw new BadRequestException(
          'Only SPEND transactions can be refunded',
        );
      }

      if (transaction.status !== 'COMPLETED') {
        throw new BadRequestException(
          'Only completed transactions can be refunded',
        );
      }

      // Create refund transaction
      await tx.walletTransaction.create({
        data: {
          wallet_id: transaction.wallet_id,
          type: 'REFUND',
          amount: transaction.amount,
          status: 'COMPLETED',
          metadata: { originalTransactionId: transaction.id },
        },
      });

      // Add funds back to wallet
      await tx.wallet.update({
        where: { id: transaction.wallet_id },
        data: { balance: { increment: transaction.amount } },
      });

      return { success: true };
    });
  }

  async getTransactions(userId: string, limit = 10, offset = 0) {
    const wallet = await this.getWallet(userId);
    return this.prisma.walletTransaction.findMany({
      where: { wallet_id: wallet.id },
      orderBy: { created_at: 'desc' },
      take: limit,
      skip: offset,
    });
  }


  // ------------------------------
  //           Add Card
  // ------------------------------

  async ensureCustomer(userId: string, email?: string) {
    try {
      // console.log('inside c => ', userId)
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if(!user) throw new BadRequestException('User not found')
      if (user?.stripeCustomerId) return user.stripeCustomerId;

      const customer = await this.stripe.customers.create({ email });
      // console.log(customer)
      await this.prisma.user.update({
        where: { id: userId },
        data: { stripeCustomerId: customer.id },
        // data: {}
    });
    return customer.id;
    } catch (error) {
      console.log(error)
    }
  }

  // Step 1: Create SetupIntent (frontend will confirm and attach a PM to this customer)
  async createSetupIntent(userId: string) {
    // console.log('userid => ', userId)
    const customerId = await this.ensureCustomer(userId);
    const si = await this.stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: ['card'],
      usage: 'off_session', // safe default for future charges too
    });
    return { client_secret: si.client_secret };
  }

  // Optional helper: pull safe metadata from Stripe PaymentMethod
  private toSafeFields(pm: Stripe.PaymentMethod) {
    const card = pm.card;
    return {
      brand: card?.brand ?? null,
      last4: card?.last4 ?? null,
      expMonth: card?.exp_month ?? null,
      expYear: card?.exp_year ?? null,
    };
  }

  // Called after SetupIntent succeeds (via webhook) or a direct fetch
  async upsertPaymentMethod(userId: string, stripePaymentMethodId: string) {
    const pm = await this.stripe.paymentMethods.retrieve(stripePaymentMethodId);
    const safe = this.toSafeFields(pm);
    return this.prisma.paymentMethod.upsert({
      where: { stripePaymentMethodId: stripePaymentMethodId },
      update: { ...safe },
      create: {
        userId,
        stripePaymentMethodId,
        ...safe,
      },
    });
  }

  async listCards(userId: string) {
    return this.prisma.paymentMethod.findMany({
      where: { userId },
      orderBy: { created_at: 'desc' },
    });
  }

  async setDefaultCard(userId: string, stripePaymentMethodId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.stripeCustomerId) throw new Error('Customer not found');

    await this.stripe.customers.update(user.stripeCustomerId, {
      invoice_settings: { default_payment_method: stripePaymentMethodId },
    });

    // reflect in DB (optional convenience)
    await this.prisma.paymentMethod.updateMany({
      where: { userId },
      data: { is_default: false },
    });
    await this.prisma.paymentMethod.update({
      where: { stripePaymentMethodId },
      data: { is_default: true },
    });
  }

  // Step 2: Pay with a selected saved card
  async payWithSavedCard(userId: string, stripePaymentMethodId: string, amountInCents: number, currency = 'usd') {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.stripeCustomerId) throw new Error('Customer not found');

    const pi = await this.stripe.paymentIntents.create(
      {
        amount: amountInCents,
        currency,
        customer: user.stripeCustomerId,
        payment_method: stripePaymentMethodId,
        confirm: true,
        // set off_session false since user is actively selecting a card on-site
        off_session: false,
        automatic_payment_methods: { enabled: true },
      },
      { idempotencyKey: `${userId}:${stripePaymentMethodId}:${amountInCents}:${Date.now()}` },
    );

    return pi;
  }

  async detachCard(userId: string, stripePaymentMethodId: string) {
    // optional authorization: ensure this PM belongs to userId in DB
    await this.prisma.paymentMethod.delete({ where: { stripePaymentMethodId } });
    return this.stripe.paymentMethods.detach(stripePaymentMethodId);
  }
}

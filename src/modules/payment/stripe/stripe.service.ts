import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { StripePayment } from '../../../common/lib/Payment/stripe/StripePayment';
import { PrismaService } from 'src/prisma/prisma.service';
import Stripe from 'stripe';
import appConfig from 'src/config/app.config';
import { CreateAccountLinkDto } from './dto/create-account-link.dto';
import config from 'src/config/app.config';
import { TransactionRepository } from 'src/common/repository/transaction/transaction.repository';
import { TransactionStatus, TransactionType } from '@prisma/client';

@Injectable()
export class StripeService {
  private stripe: Stripe;
  private readonly logger = new Logger(StripeService.name);
  constructor(private prisma: PrismaService) {
    this.stripe = new Stripe(appConfig().payment.stripe.secret_key, {
      apiVersion: '2025-03-31.basil',
    });
  }

  async handleWebhook(rawBody: string, sig: string | string[]) {
    return StripePayment.handleWebhook(rawBody, sig);
  }

  async test() {
    try {
      const account = await this.stripe.accounts.retrieve();
      console.log('Account retrieved:', account.id);

      return account;
    } catch (e) {
      console.error('Error:', e.message);
    }
  }

  async saveCard(userId: string, paymentMethodId: string) {
    // 1. Find the user in your database
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // 2. Create a Stripe customer or get the existing one
    let customerId = user.billing_id;
    if (!customerId) {
      const stripeCustomer = await this.stripe.customers.create({
        email: user.email,
        payment_method: paymentMethodId,
      });
      customerId = stripeCustomer.id;

      // 3. Save the new Stripe customer ID in your database
      await this.prisma.user.update({
        where: { id: userId },
        data: { billing_id: customerId },
      });
    } else {
      // 4. Attach the new payment method to the existing customer
      await this.stripe.paymentMethods.attach(paymentMethodId, {
        customer: customerId,
      });
    }

    // 5. Save the payment method ID to your database
    const paymentMethod = await this.prisma.paymentMethod.create({
      data: {
        stripePaymentMethodId: paymentMethodId,
        userId: user.id,
      },
    });

    return paymentMethod;
  }

  async getPaymentIntent(booking_id: string, user_id: string) {
    // 1. Retrieve the booking details from the database using the booking_id
    const booking = await this.prisma.booking.findUnique({
      where: { id: booking_id, owner_id: user_id },
      include: {
        traveller: {
          select: {
            id: true,
            first_name: true,
          },
        }, // Include related  details
        owner: {
          select: {
            id: true,
            billing_id: true,
            first_name: true,
          },
        }, // Include user (booking placer) details
      },
    });

    if (!booking) {
      throw new NotFoundException('booking not found');
    }

    if (booking.payment_status == 'complated') {
      throw new ForbiddenException('Payment already complated');
    }

    // // 2. Fetch the service and order user details
    // const service = order.service;
    // const orderUser = order.order_user;

    // // 3. Ensure the total amount is provided in the order
    // const total = order.total;

    // if (!total || total <= 0) {
    //   throw new BadRequestException('Invalid total amount');
    // }

    // 4. Create a Stripe PaymentIntent using the total from the order
    const paymentIntent = await StripePayment.createPaymentIntent({
      amount: Number(booking.amount), // Convert amount to cents
      currency: process.env.CURRENCY || 'EUR',
      customer_id: booking.owner.billing_id, // Ensure the user has a Stripe customer ID
      metadata: {
        owner_id: booking.owner_id,
        traveller_id: booking.traveller_id,
        package_id: booking.package_id,
        travel_id: booking.travel_id,
        booking_id: booking_id,
        owner_first_name: booking.owner.first_name,
        traveller_first_name: booking.traveller.first_name,
      },
    });

    // console.log(paymentIntent)

    // 5. Retrieve the balance transaction (if needed)
    // const balanceTransactions = await StripePayment.getBalanceTransaction(paymentIntent.id);

    // 6. update order
    await this.prisma.booking.update({
      where: { id: booking_id },
      data: {
        payment_intent_id: paymentIntent.id,
      },
    });

    // 7. Return the PaymentIntent details along with the balance transaction
    return {
      success: true,
      message: 'Client secret retrieved successfully',
      data: {
        // order,
        client_secret: paymentIntent.client_secret,
        // balanceTransactions,
      },
    };
  }

  // Optional: A method to charge a customer using a saved card
  async createPayment(userId: string, amount: number, paymentMethodId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user || !user.billing_id) {
      // user.paymentMethods.length === 0
      throw new NotFoundException('User not found');
    }

    // Use the first saved payment method
    // const defaultPaymentMethod = user.paymentMethods[0];

    const paymentMethod = await this.prisma.paymentMethod.findUnique({
      where: { stripePaymentMethodId: paymentMethodId, userId },
    });

    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: amount,
      currency: process.env.CURRENCY || 'EUR',
      customer: user.stripeCustomerId,
      payment_method: paymentMethod.stripePaymentMethodId,
      off_session: true, // This is crucial for recurring payments
      confirm: true,
    });

    return paymentIntent;
  }

  async processPayment(
    userId: string,
    paymentMethodId: string,
    bookingId: string,
  ) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        traveller: {
          select: {
            id: true,
            first_name: true,
          },
        },
      },
    });

    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.payment_status == 'complated') {
      throw new ForbiddenException('Payment already complated');
    }
    // 1. Find the user and their Stripe Customer ID in your database
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { billing_id: true, first_name: true },
    });

    if (!user || !user.billing_id) {
      throw new NotFoundException('User or Stripe customer not found');
    }

    try {
      // 2. Use Stripe's PaymentIntents API to create and confirm a payment
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Number(booking.amount) * 100,
        currency: process.env.CURRENCY || 'EUR',
        customer: user.billing_id,
        payment_method: paymentMethodId,
        off_session: true, // This is crucial for payments where the user is not actively on the checkout page
        confirm: true,
      });

      if (paymentIntent.status === 'succeeded') {
        await this.prisma.booking.update({
          where: { id: bookingId },
          data: {
            paid: true,
            payment_status: 'complated',
            payment_intent_id: paymentIntent.id,
          },
        });

        // transaction
        await TransactionRepository.createTransaction({
          user_id: userId,
          type: TransactionType.BOOKING_PAYMENT,
          amount: booking.amount.toNumber(),
          status: TransactionStatus.COMPLETED,
          description: `Payment for booking ${booking.id}`,
          reference_id: paymentIntent.id,
          booking_id: bookingId,
        });

        await this.prisma.announcementRequest.create({
          data: {
            package_id: booking.package_id,
            travel_id: booking.travel_id,
            booking_id: booking.id,
          },
        });

        await this.prisma.notification.createMany({
          data: [
            {
              notification_message: `Your booking request is pending. Waiting for ${booking.traveller.first_name}’s confirmation (up to 12h).`,
              notification_type: 'pending',
              receiver_id: userId,
            },
            {
              notification_message: `You have received a new booking request from ${user.first_name}. Respond within 12 hours.`,
              notification_type: 'pending',
              receiver_id: booking.traveller_id,
            },
          ],
        });

        await this.prisma.conversation.updateMany({
          where: {
            travel_id: booking.travel_id,
            package_id: booking.package_id,
          },
          data: {
            notification_type: 'pending',
          },
        });
      } else {
        await TransactionRepository.createTransaction({
          user_id: userId,
          type: TransactionType.BOOKING_PAYMENT,
          amount: booking.amount.toNumber(),
          status: TransactionStatus.FAILED,
          description: `Payment for booking ${booking.id}`,
          reference_id: paymentIntent.id,
          booking_id: bookingId,
        });
      }

      // 3. Return the payment status to the client
      return {
        success: paymentIntent.status === 'succeeded',
        status: paymentIntent.status,
      };
    } catch (error) {
      // console.error('Stripe payment error:', error.message);
      // You should handle various Stripe errors here (e.g., card_declined, insufficient_funds)
      return {
        success: false,
        status: 'failed',
        message: error.message,
      };
    }
  }

  async listSavedCards(userId: string) {
    // 1. Find the user and their Stripe Customer ID in your database
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { billing_id: true },
    });

    if (!user || !user.billing_id) {
      return []; // Return an empty array if no customer ID exists
    }

    // 2. Use the Stripe API to list all payment methods for this customer
    const paymentMethods = await this.stripe.customers.listPaymentMethods(
      user.billing_id,
      {
        type: 'card',
      },
    );

    // 3. Map the results to a simplified, secure object for the frontend
    const cards = paymentMethods.data.map((pm) => ({
      id: pm.id,
      brand: pm.card.brand,
      last4: pm.card.last4,
      exp_month: pm.card.exp_month,
      exp_year: pm.card.exp_year,
    }));

    return {
      success: true,
      data: cards,
    };
  }

  // Create Stripe Connect account and onboarding link
  async createConnectedAccount(user_id: string) {
    return await this.prisma.$transaction(async (tx) => {
      // Check if user already has an active Stripe account
      const existingAccount = await tx.stripeAccount.findUnique({
        where: { user_id },
      });

      let stripeAccountId: string;

      if (existingAccount) {
        // Use existing Stripe account
        stripeAccountId = existingAccount.stripe_account_id;

        // Reactivate if previously deactivated
        if (!existingAccount.is_active) {
          await tx.stripeAccount.update({
            where: { user_id },
            data: { is_active: true },
          });
        }
      } else {
        // Create new Stripe Connect account with minimal info
        const stripeAccount = await this.stripe.accounts.create({
          type: 'express',
          // Stripe will collect all other details during onboarding
        });

        // Store only the Stripe account ID
        await tx.stripeAccount.create({
          data: {
            user_id,
            stripe_account_id: stripeAccount.id,
            is_active: true,
          },
        });

        stripeAccountId = stripeAccount.id;
      }

      // this.logger.log(`Created/retrieved Stripe account for user ${user_id}: ${stripeAccountId}`);

      return { stripe_account_id: stripeAccountId };
    });
  }

  // Generate onboarding link
  async createAccountLink(
    user_id: string,
    createAccountLinkDto: CreateAccountLinkDto,
  ) {
    const account = await this.getActiveConnectedAccount(user_id);

    const accountLink = await this.stripe.accountLinks.create({
      account: account.stripe_account_id,
      refresh_url:
        createAccountLinkDto.refresh_url ||
        `${process.env.CLIENT_URL}/stripe/reauth`,
      return_url:
        createAccountLinkDto.return_url ||
        `${process.env.CLIENT_URL}/stripe/success`,
      type: 'account_onboarding',
    });

    return {
      url: accountLink.url,
      expires_at: accountLink.expires_at,
    };
  }

  // Get active connected account
  async getActiveConnectedAccount(user_id: string) {
    const account = await this.prisma.stripeAccount.findFirst({
      where: {
        user_id,
        is_active: true,
      },
      include: {
        user: {
          include: {
            wallet: true,
          },
        },
      },
    });

    if (!account) {
      throw new NotFoundException('No active connected account found');
    }

    return account;
  }

  // Get account status from Stripe
  async getAccountStatus(user_id: string) {
    try {
      const account = await this.getActiveConnectedAccount(user_id);

      console.log('account => ', account);
      const stripeAccount = await this.stripe.accounts.retrieve(
        account.stripe_account_id,
      );

      // const stripeAccount = await this.stripe.accounts.retrieve(
      //   account.stripe_account_id,
      // );

      return {
        stripe_account_id: account.stripe_account_id,
        charges_enabled: stripeAccount.charges_enabled,
        payouts_enabled: stripeAccount.payouts_enabled,
        details_submitted: stripeAccount.details_submitted,
        requirements: stripeAccount.requirements,
      };
    } catch (error) {
      console.log(error);
      throw error;
    }
  }
  // Process payout to user's Stripe account
  async processPayout(
    user_id: string,
    amount: number,
    currency: string = process.env.CURRENCY || 'EUR',
  ) {
    try {
      const account = await this.getActiveConnectedAccount(user_id);

      // Verify the account can receive payouts
      const stripeAccount = await this.stripe.accounts.retrieve(
        account.stripe_account_id,
      );
      if (!stripeAccount.payouts_enabled) {
        throw new BadRequestException(
          'Account is not ready for payouts. Please complete verification on Stripe.',
        );
      }

      if (Number(account.user.wallet.balance) < amount) {
        throw new BadRequestException('Insufficient balance');
      }

      if (1 > amount) {
        throw new BadRequestException('Withdraw can not be less then 1');
      }

      const amountInCents = Math.round(amount * 100); // Convert to cents

      // need to check balance before transfer
      const balance = await this.stripe.balance.retrieve();
      console.log(balance);

      //       {
      //   object: 'balance',
      //   available: [ { amount: 0, currency: 'usd', source_types: [Object] } ],
      //   connect_reserved: [ { amount: 0, currency: 'usd' } ],
      //   livemode: false,
      //   pending: [ { amount: 6359, currency: 'usd', source_types: [Object] } ],
      //   refund_and_dispute_prefunding: { available: [ [Object] ], pending: [ [Object] ] }
      // }

      const availableBalance = balance.available.find(
        (b) => b.currency.toLowerCase() === currency.toLowerCase(),
      );
      if (!availableBalance || availableBalance.amount < amountInCents) {
        throw new BadRequestException(
          'Insufficient balance for this currency on the platform. Please try again later. Or contact support.',
        );
      }

      // Transfer funds to the connected account
      const transfer = await this.stripe.transfers.create({
        amount: amountInCents,
        currency: currency,
        destination: account.stripe_account_id,
        description: `Payout for completed orders`,
      });

      // reduce wallet by x amount
      await this.prisma.wallet.update({
        where: { id: account.user.wallet.id },
        data: {
          balance: {
            decrement: amount,
          },
        },
      });

      // transction
      await TransactionRepository.createTransaction({
        user_id: account.user_id,
        wallet_id: account.user.wallet.id,
        type: TransactionType.WALLET_WITHDRAW,
        amount: amount,
        status: TransactionStatus.COMPLETED,
      });

      // Initiate Stripe payout (convert amount to cents)
      const payout = await this.stripe.payouts.create(
        {
          amount: amountInCents, // Convert dollars to cents
          currency: process.env.CURRENCY || 'EUR',
          // destination: dto.destinationAccountId,
          metadata: {
            currency: currency,
            destination: account.stripe_account_id,
            description: `Payout for completed orders`,
          },
        },
        {
          stripeAccount: account.stripe_account_id,
        },
      );

      this.logger.log(`Processed payout of ${amount} to user ${user_id}`);
      // console.log(transfer)

      return {
        transfer_id: transfer.id,
        amount: amount,
        currency: currency,
        status: transfer.created,
      };
    } catch (error) {
      // Handle Stripe API errors specifically
      // if (error && error.type && error.type.startsWith('Stripe')) {
      //   this.logger.error(`Stripe error: ${error.message}`);
      //   throw new BadRequestException(`Stripe error: ${error.message}`);
      // }
      console.log('error => ', error);
      // // Handle known custom errors (optional)
      if (error instanceof BadRequestException) {
        throw error; // rethrow as is
      }

      // Handle any other unexpected errors
      // this.logger.error(`Unexpected error in payout: ${error.message || error}`);
      throw new BadRequestException(
        'An unexpected error occurred while processing payout. Try again later.',
      );
    }
  }

  // Deactivate account (soft delete)
  async deactivateAccount(user_id: string) {
    const account = await this.getActiveConnectedAccount(user_id);

    const updatedAccount = await this.prisma.stripeAccount.update({
      where: { id: account.id },
      data: { is_active: false },
    });

    this.logger.log(`Deactivated Stripe account for user ${user_id}`);

    return updatedAccount;
  }

  // Create login link for users to access their Stripe dashboard
  async createLoginLink(user_id: string) {
    const account = await this.getActiveConnectedAccount(user_id);

    const loginLink = await this.stripe.accounts.createLoginLink(
      account.stripe_account_id,
    );

    return { url: loginLink.url };
  }

  // List payouts for the connected account
  async listPayoutsForUser(
    userId: string,
    limit = 5,
    cursor?: { starting_after?: string; ending_before?: string },
    status?: string,
  ) {
    try {
      const { stripe_account_id } =
        await this.getActiveConnectedAccount(userId);

      const listParams: Stripe.PayoutListParams = { limit };
      if (cursor?.starting_after)
        listParams.starting_after = cursor.starting_after;
      if (cursor?.ending_before)
        listParams.ending_before = cursor.ending_before;
      if (status) listParams.status = status;

      const payouts = await this.stripe.payouts.list(listParams, {
        stripeAccount: stripe_account_id,
      });

      return {
        user_id: userId,
        account: stripe_account_id,
        count: payouts.data.length,
        has_more: payouts.has_more,
        payouts: payouts.data.map((p) => ({
          id: p.id,
          amount: p.amount / 100,
          currency: p.currency,
          status: p.status,
          method: p.method,
          arrival_date: p.arrival_date ? new Date(p.arrival_date * 1000) : null,
          created: new Date(p.created * 1000),
          description: p.description ?? null,
          destination:
            typeof p.destination === 'string'
              ? p.destination
              : (p.destination?.id ?? null),
          failure_code: p.failure_code ?? null,
          failure_message: p.failure_message ?? null,
          statement_descriptor: p.statement_descriptor ?? null,
        })),
      };
    } catch (error: any) {
      if (error && error.type && String(error.type).startsWith('Stripe')) {
        this.logger.error(`Stripe error: ${error.message}`);
        throw new BadRequestException(`Stripe error: ${error.message}`);
      }
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      )
        throw error;
      this.logger.error(`Unexpected error: ${error?.message || error}`);
      throw new BadRequestException('Failed to list payouts.');
    }
  }

  // get platform account
  async getPlatformAccount() {
    const platformAccount = await this.stripe.accounts.retrieve();
    return platformAccount;
  }

  // Platform Payout
  async platformPayout(
    user_id: string,
    amount: number,
    currency: string = process.env.CURRENCY || 'EUR',
  ) {
    // check platform wallet balance
    const platformWallet = await this.prisma.platformWallet.findFirst({
      select: {
        total_earnings: true,
        id: true,
      },
    });

    // console.log("platformWallet.total_earnings.toNumber(), amount => ", platformWallet.total_earnings.toNumber(), amount)

    if (platformWallet.total_earnings.toNumber() < amount) {
      throw new BadRequestException('Insufficient balance');
    }

    try {
      // const accounts = await this.getPlatformAccount();
      // console.log("accounts => ", accounts)
      // transfer
      // await this.stripe.transfers.create({
      //   amount: amount * 100,
      //   currency: currency,
      //   destination: accounts.id,
      // });

      const balances = await this.stripe.balance.retrieve();
      // console.log("balance => ", balances)

      // check balance acording to currency
      const balance = balances.available.find(
        (b) => b.currency === currency.toLowerCase(),
      );
      // console.log("balance => ", balance)
      if (!balance) {
        // throw error no account for this currency
        throw new BadRequestException('No account for this currency');
      }

      if (balance.amount < amount) {
        throw new BadRequestException('Insufficient balance');
      }

      // create payout
      await this.stripe.payouts.create({
        amount: amount * 100,
        currency: currency.toLowerCase(),
        metadata: {
          description: `Platform Payout in ${currency}`,
        },
      });

      // create transaction
      await TransactionRepository.createTransaction({
        user_id,
        type: TransactionType.PLATFORM_PAYOUT,
        amount: amount,
        status: TransactionStatus.COMPLETED,
        description: `Platform Payout in ${currency.toLowerCase()}`,
        reference_id: platformWallet.id,
      });

      // update platform wallet
      await this.prisma.platformWallet.update({
        where: { id: platformWallet.id },
        data: { total_earnings: { decrement: amount } },
      });

      return {
        success: true,
        message: 'Platform payout processed successfully',
      };
    } catch (error) {
      // transaction
      await TransactionRepository.createTransaction({
        user_id,
        type: TransactionType.PLATFORM_PAYOUT,
        amount: amount,
        status: TransactionStatus.FAILED,
        description: `Platform Payout in ${currency.toLowerCase()}`,
        reference_id: platformWallet.id,
      });
      // console.log("error => ", error)
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to process platform payout.');
    }
  }
}

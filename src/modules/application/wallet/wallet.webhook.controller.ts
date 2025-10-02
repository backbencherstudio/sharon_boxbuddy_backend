import {
  Controller,
  Headers,
  HttpStatus,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { WalletConfig } from './wallet.config';
import { WalletService } from './wallet.service';
import Stripe from 'stripe';
import { MessageGateway } from 'src/modules/chat/message/message.gateway';

// export const config = {
//   api: {
//     bodyParser: false, // Disable default body parsing
//   },
// }

@Controller('wallet/webhook')
export class WalletWebhookController {
  constructor(
    private readonly walletService: WalletService,
    private readonly config: WalletConfig,
    private gateway: MessageGateway
  ) { }

  @Post()
  async handleWebhook(
    // @Body() body: any,
    @Headers('stripe-signature') signature: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    // const body = await this.getRawBody(req);
    const body = req.rawBody.toString();
    // console.log('Received webhook:', body);
    // console.log('Signature:', signature)
    const event = this.constructEvent(body, signature);

    console.log('Received webhook:', event.type);

    switch (event.type) {
      case 'payment_intent.succeeded':
        await this.handlePaymentSuccess(event);
        break;
      case 'payment_intent.payment_failed':
        await this.handlePaymentFailed(event);
        break;
      case 'payout.paid':
        await this.handlePayoutSuccess(event);
        break;
      case 'payout.failed':
        await this.handlePayoutFailed(event);
        break;

      case 'identity.verification_session.verified':
        console.log('identity.verification_session.verified');
        await this.identityVerification(event);
        break;

      case 'setup_intent.succeeded': {
        const si = event.data.object as Stripe.SetupIntent;
        const customerId = si.customer as string | null;
        const pmId = si.payment_method as string | null;
        const userId = await this.findUserIdByCustomerId(customerId);

        if (userId && pmId) {
          await this.upsertPaymentMethod(userId, pmId);
        }
        break;

      }

      case 'payment_method.attached': {
        const pm = event.data.object as Stripe.PaymentMethod;
        const customerId = (pm.customer as string) || null;
        const userId = await this.findUserIdByCustomerId(customerId);
        if (userId) {
          await this.upsertPaymentMethod(userId, pm.id);
        }
        break;
      }

      case 'payment_method.detached': {
        const pm = event.data.object as Stripe.PaymentMethod;
        // Remove from our DB
        await this.walletService['prisma'].paymentMethod
          .delete({ where: { stripePaymentMethodId: pm.id } })
          .catch(() => null);
        break;
      }

      case 'customer.updated': {
        // If default payment method changed in Stripe Dashboard, reflect in DB
        const c = event.data.object as Stripe.Customer;
        const userId = await this.findUserIdByCustomerId(c.id);
        const defaultPm = (c.invoice_settings?.default_payment_method as string) || null;

        if (userId) {
          // Reset all flags
          await this.walletService['prisma'].paymentMethod.updateMany({
            where: { userId },
            data: { is_default: false },
          });
          if (defaultPm) {
            await this.walletService['prisma'].paymentMethod.update({
              where: { stripePaymentMethodId: defaultPm },
              data: { is_default: true },
            }).catch(() => { });
          }
        }
        break;
      }

    }

    res.status(HttpStatus.OK).send();
  }

  private constructEvent(body: any, signature: string) {
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    return stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  }

  // Helper to get raw body as Buffer
  private async getRawBody(req: Request): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Uint8Array[] = [];
      req.on('data', (chunk) => chunks.push(chunk));
      req.on('end', () => resolve(Buffer.concat(chunks)));
      req.on('error', reject);
    });
  }


  private async upsertPaymentMethod(userId: string, pmId: string) {
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    const pm = await stripe.paymentMethods.retrieve(pmId);
    const safe = this.toSafeFields(pm);
    return this.walletService['prisma'].paymentMethod.upsert({
      where: { stripePaymentMethodId: pm.id },
      update: { ...safe },
      create: { userId, stripePaymentMethodId: pm.id, ...safe },
    });
  }

  private toSafeFields(pm: Stripe.PaymentMethod) {
    const card = pm.card;
    return {
      brand: card?.brand ?? null,
      last4: card?.last4 ?? null,
      expMonth: card?.exp_month ?? null,
      expYear: card?.exp_year ?? null,
    };
  }

  private async findUserIdByCustomerId(customerId: string | null): Promise<string | null> {
    if (!customerId) return null;
    const user = await this.walletService['prisma'].user.findFirst({ where: { stripeCustomerId: customerId } });
    return user?.id ?? null;
  }

  private async identityVerification(event: any) {
    const verificationSession = event.data.object;

    // Update your database with the verification result
    await this.walletService['prisma'].user.update({
      where: { id: verificationSession.metadata.user_id },
      data: {
        verificationStatus: 'completed',

        stripeSessionId: verificationSession.id,
      },
    });
  }

  private async handlePaymentSuccess(event: any) {
    const paymentIntent = event.data.object;
    const metadata = paymentIntent.metadata;

    // if (metadata.transactionId) {
    //   await this.walletService['prisma'].walletTransaction.update({
    //     where: { id: metadata.transactionId },
    //     data: { status: 'COMPLETED' },
    //   });

    //   // Update wallet balance
    //   const transaction = await this.walletService[
    //     'prisma'
    //   ].walletTransaction.findUnique({
    //     where: { id: metadata.transactionId },
    //   });

    //   await this.walletService['prisma'].wallet.update({
    //     where: { id: transaction.wallet_id },
    //     data: { balance: { increment: transaction.amount } },
    //   });
    // }

    // console.log(JSON.stringify(paymentIntent, null, 4))
    // console.log("amount => ", paymentIntent.amount, parseFloat(paymentIntent.amount) / 100)


    await this.walletService['prisma'].booking.update({
      where: { id: metadata.booking_id },
      data: {
        paid: true,
        payment_status: 'complated',
        payment_intent_id: paymentIntent.id,
        amount: (paymentIntent.amount / 100).toFixed(4)  || 0
      }
    })  

    

    await this.walletService['prisma'].announcementRequest.create({
      data: {
        package_id: metadata.package_id,
        travel_id: metadata.travel_id,
        booking_id: metadata.booking_id,
      },
    });

    const notifications = await this.walletService['prisma'].notification.createManyAndReturn({
      data: [
        {
          notification_message: `Your booking request is pending. Waiting for ${metadata.traveller_first_name}’s confirmation (up to 12h).`,
          notification_type: 'pending',
          receiver_id: metadata.owner_id
        },
        {
          notification_message: `You have received a new booking request from ${metadata.owner_first_name}. Respond within 12 hours.`,
          notification_type: 'pending',
          receiver_id: metadata.traveller_id
        }
      ]
    })


    const conversations = await this.walletService['prisma'].conversation.updateManyAndReturn({
      where: {
          travel_id: metadata.travel_id,
          package_id: metadata.package_id,
      },
      data: {
        notification_type: 'pending'
      },
      include: {
          package: {
            select: {
              owner_id: true,
            }
          },
          travel: {
            select: {
              user_id: true
            }
          }
        }
    })

    // sending notification for notification and conversation
      // notification
      notifications.forEach(notification => {
        this.gateway.server.to(notification.receiver_id).emit("notification", notification)
      });

      // conversation
      conversations.forEach(conv => {
        // sending to package owner
        this.gateway.server.to(conv.package.owner_id).emit("conversation-notification-update", {
          id: conv.id,
          notification_type: conv.notification_type
        })
      })


  }

  private async handlePaymentFailed(event: any) {
    const paymentIntent = event.data.object;
    const metadata = paymentIntent.metadata;

    if (metadata.transactionId) {
      await this.walletService['prisma'].walletTransaction.update({
        where: { id: metadata.transactionId },
        data: { status: 'FAILED' },
      });
    }
  }

  private async handlePayoutSuccess(event: any) {
    const payout = event.data.object;
    const metadata = payout.metadata;

    if (metadata.transactionId) {
      await this.walletService['prisma'].walletTransaction.update({
        where: { id: metadata.transactionId },
        data: { status: 'COMPLETED' },
      });
    }
  }

  private async handlePayoutFailed(event: any) {
    const payout = event.data.object;
    const metadata = payout.metadata;

    if (metadata.transactionId) {
      const transaction = await this.walletService[
        'prisma'
      ].walletTransaction.findUnique({
        where: { id: metadata.transactionId },
        include: { wallet: true },
      });

      // Auto-refund to wallet
      await this.walletService['prisma'].$transaction([
        this.walletService['prisma'].wallet.update({
          where: { id: transaction.wallet_id },
          data: { balance: { increment: transaction.amount } },
        }),
        this.walletService['prisma'].walletTransaction.update({
          where: { id: metadata.transactionId },
          data: { status: 'FAILED' },
        }),
        this.walletService['prisma'].walletTransaction.create({
          data: {
            wallet_id: transaction.wallet_id,
            type: 'REFUND',
            amount: transaction.amount,
            status: 'COMPLETED',
            metadata: {
              originalTransactionId: metadata.transactionId,
              reason: 'Payout failed',
            },
          },
        }),
      ]);
    }
  }
}

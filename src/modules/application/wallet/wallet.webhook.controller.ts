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
  ) {}

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

    if (metadata.transactionId) {
      await this.walletService['prisma'].walletTransaction.update({
        where: { id: metadata.transactionId },
        data: { status: 'COMPLETED' },
      });

      // Update wallet balance
      const transaction = await this.walletService[
        'prisma'
      ].walletTransaction.findUnique({
        where: { id: metadata.transactionId },
      });

      await this.walletService['prisma'].wallet.update({
        where: { id: transaction.wallet_id },
        data: { balance: { increment: transaction.amount } },
      });
    }
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

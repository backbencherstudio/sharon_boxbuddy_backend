import { Controller, Post, Req, Headers, Body, Get, UseGuards } from '@nestjs/common';
import { StripeService } from './stripe.service';
import { Request } from 'express';
import { TransactionRepository } from '../../../common/repository/transaction/transaction.repository';
import { SaveCardDto } from './dto/save-card.dto';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { ProcessPaymentDto } from './dto/process-payment.dto';
import { PaymentIntentDto } from './dto/payment-intent.dto';

@Controller('payment/stripe')
export class StripeController {
  constructor(private readonly stripeService: StripeService) { }

  @Post('webhook')
  async handleWebhook(
    @Headers('stripe-signature') signature: string,
    @Req() req: Request,
  ) {
    try {
      const payload = req.rawBody.toString();
      const event = await this.stripeService.handleWebhook(payload, signature);

      // Handle events
      switch (event.type) {
        case 'customer.created':
          break;
        case 'payment_intent.created':
          break;
        case 'payment_intent.succeeded':
          const paymentIntent = event.data.object;
          // create tax transaction
          // await StripePayment.createTaxTransaction(
          //   paymentIntent.metadata['tax_calculation'],
          // );
          // Update transaction status in database
          await TransactionRepository.updateTransaction({
            reference_number: paymentIntent.id,
            status: 'succeeded',
            paid_amount: paymentIntent.amount / 100, // amount in dollars
            paid_currency: paymentIntent.currency,
            raw_status: paymentIntent.status,
          });
          break;
        case 'payment_intent.payment_failed':
          const failedPaymentIntent = event.data.object;
          // Update transaction status in database
          await TransactionRepository.updateTransaction({
            reference_number: failedPaymentIntent.id,
            status: 'failed',
            raw_status: failedPaymentIntent.status,
          });
        case 'payment_intent.canceled':
          const canceledPaymentIntent = event.data.object;
          // Update transaction status in database
          await TransactionRepository.updateTransaction({
            reference_number: canceledPaymentIntent.id,
            status: 'canceled',
            raw_status: canceledPaymentIntent.status,
          });
          break;
        case 'payment_intent.requires_action':
          const requireActionPaymentIntent = event.data.object;
          // Update transaction status in database
          await TransactionRepository.updateTransaction({
            reference_number: requireActionPaymentIntent.id,
            status: 'requires_action',
            raw_status: requireActionPaymentIntent.status,
          });
          break;
        case 'payout.paid':
          const paidPayout = event.data.object;
          console.log(paidPayout);
          break;
        case 'payout.failed':
          const failedPayout = event.data.object;
          console.log(failedPayout);
          break;
        default:
          console.log(`Unhandled event type ${event.type}`);
      }

      return { received: true };
    } catch (error) {
      console.error('Webhook error', error);
      return { received: false };
    }
  }


  @UseGuards(JwtAuthGuard)
  @Post('save-card')
  async saveCard(@Body() saveCardDto: SaveCardDto, @Req() req: Request) {
    // In a real application, you would get the user ID from the request object (e.g., from a JWT)
    // const userId = 'a-static-user-id-for-demonstration'; 
    const userId = req.user?.userId; // For example, if you use Passport.js
    return this.stripeService.saveCard(userId, saveCardDto.paymentMethodId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('cards')
  async listCards(@Req() req: Request) {
    // In a real app, you would get the user ID from the authenticated request object
    // const userId = 'a-static-user-id-for-demonstration'; 
    const userId = req.user?.userId; // Example with JWT authentication

    return this.stripeService.listSavedCards(userId);
  }

  // New endpoint to process a payment
  @UseGuards(JwtAuthGuard)
  @Post('charge')
  async charge(@Body() processPaymentDto: ProcessPaymentDto, @Req() req: Request) {
    const userId = req?.user?.userId;
    return this.stripeService.processPayment(
      userId,
      processPaymentDto.paymentMethodId,
      processPaymentDto.amount,
      processPaymentDto.bookingId
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('payment-intent')
  async getPaymentIntent(@Body() paymentIntentDto: PaymentIntentDto, @Req() req: Request) {
    const userId = req?.user?.userId;
    return this.stripeService.getPaymentIntent(
      paymentIntentDto.bookingId,
      userId
    );
  }
}

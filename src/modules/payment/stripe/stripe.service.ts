import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { StripePayment } from '../../../common/lib/Payment/stripe/StripePayment';
import { PrismaService } from 'src/prisma/prisma.service';
import Stripe from 'stripe';
import appConfig from 'src/config/app.config';




@Injectable()
export class StripeService {
  private stripe: Stripe;
  constructor(private prisma: PrismaService) {

    this.stripe = new Stripe(appConfig().payment.stripe.secret_key, {
      apiVersion: '2025-03-31.basil',
    });
  }


  async handleWebhook(rawBody: string, sig: string | string[]) {
    return StripePayment.handleWebhook(rawBody, sig);
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
          }
        }, // Include related  details
        owner: {
          select: {
            id: true,
            billing_id: true,
            first_name: true,
          }
        }, // Include user (booking placer) details
      },
    });

    if (!booking) {
      throw new NotFoundException('booking not found');
    }

    if (booking.payment_status == 'complated') {
      throw new ForbiddenException('Payment already complated')
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
      amount: 50.55, // Convert amount to cents
      currency: 'usd',
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
      }
    })

    // 7. Return the PaymentIntent details along with the balance transaction
    return {
      success: true,
      message: "Client secret retrieved successfully",
      data: {
        // order,
        client_secret: paymentIntent.client_secret,
        // balanceTransactions,
      }
    };
  }

  // Optional: A method to charge a customer using a saved card
  async createPayment(userId: string, amount: number, paymentMethodId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId }
    });
    if (!user || !user.billing_id) { // user.paymentMethods.length === 0
      throw new NotFoundException('User not found');
    }

    // Use the first saved payment method
    // const defaultPaymentMethod = user.paymentMethods[0];

    const paymentMethod = await this.prisma.paymentMethod.findUnique({
      where: { stripePaymentMethodId: paymentMethodId, userId }
    })

    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: amount,
      currency: 'usd',
      customer: user.stripeCustomerId,
      payment_method: paymentMethod.stripePaymentMethodId,
      off_session: true, // This is crucial for recurring payments
      confirm: true,
    });


    return paymentIntent;
  }

  async processPayment(userId: string, paymentMethodId: string, amount: number, bookingId: string) {

    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        traveller: {
          select: {
            id: true,
            first_name: true,
          }
        },
      }
    })

    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.payment_status == 'complated') {
      throw new ForbiddenException('Payment already complated')
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
        amount: amount * 100,
        currency: 'usd',
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
          }
        })

        

        await this.prisma.announcementRequest.create({
          data: {
            package_id: booking.package_id,
            travel_id: booking.travel_id,
            booking_id: booking.id,
          },
        });

        await this.prisma.notification.createMany({
          data: [{
            notification_message: `Your booking request is pending. Waiting for ${booking.traveller.first_name}’s confirmation (up to 12h).`,
            notification_type: 'pending',
            receiver_id: userId
          },
          {
            notification_message: `You have received a new booking request from ${user.first_name}. Respond within 12 hours.`,
            notification_type: 'pending',
            receiver_id: booking.traveller_id
          }]
        })

        
        await this.prisma.conversation.updateMany({
          where: {
              travel_id: booking.travel_id,
              package_id: booking.package_id
          },
          data: {
            notification_type: 'pending'
          }
        })

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
      data: cards
    }
  }
}

// billing.service.ts
import { Inject, Injectable } from '@nestjs/common';
import Stripe from 'stripe';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class BillingService {
  constructor(
    private prisma: PrismaService,
    @Inject('STRIPE_CLIENT') private stripe: Stripe,
  ) {}

  async ensureCustomer(userId: string, email?: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (user?.stripeCustomerId) return user.stripeCustomerId;

    const customer = await this.stripe.customers.create({ email });
    await this.prisma.user.update({
      where: { id: userId },
      data: { stripeCustomerId: customer.id },
    });
    return customer.id;
  }

  // Step 1: Create SetupIntent (frontend will confirm and attach a PM to this customer)
  async createSetupIntent(userId: string) {
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
  async payWithSavedCard(
    userId: string,
    stripePaymentMethodId: string,
    amountInCents: number,
    currency = 'EUR',
  ) {
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
      {
        idempotencyKey: `${userId}:${stripePaymentMethodId}:${amountInCents}:${Date.now()}`,
      },
    );

    return pi;
  }

  async detachCard(userId: string, stripePaymentMethodId: string) {
    // optional authorization: ensure this PM belongs to userId in DB
    await this.prisma.paymentMethod.delete({
      where: { stripePaymentMethodId },
    });
    return this.stripe.paymentMethods.detach(stripePaymentMethodId);
  }
}

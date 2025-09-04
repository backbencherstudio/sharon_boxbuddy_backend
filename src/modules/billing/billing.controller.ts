// billing.controller.ts
import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { BillingService } from './billing.service';

@Controller('billing')
export class BillingController {
  constructor(private billing: BillingService) {}

  @Post('setup-intent')
  createSetupIntent(@Body() body: { userId: string }) {
    return this.billing.createSetupIntent(body.userId);
  }

  @Get('cards/:userId')
  listCards(@Param('userId') userId: string) {
    return this.billing.listCards(userId);
  }

  @Post('cards/default')
  setDefault(@Body() body: { userId: string; paymentMethodId: string }) {
    return this.billing.setDefaultCard(body.userId, body.paymentMethodId);
  }

  @Post('pay')
  pay(@Body() body: { userId: string; paymentMethodId: string; amountInCents: number; currency?: string }) {
    return this.billing.payWithSavedCard(body.userId, body.paymentMethodId, body.amountInCents, body.currency);
  }

  @Post('cards/detach')
  detach(@Body() body: { userId: string; paymentMethodId: string }) {
    return this.billing.detachCard(body.userId, body.paymentMethodId);
  }
}

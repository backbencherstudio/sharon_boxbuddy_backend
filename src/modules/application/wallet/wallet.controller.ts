import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { WalletService } from './wallet.service';

import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { DepositDto } from './dto/deposit.dto';
import { SetDefaultAccountDto } from './dto/payment-account.dto';
import { SpendDto } from './dto/spend.dto';
import { WithdrawDto } from './dto/withdraw.dto';
import { PaymentAccountService } from './payment.service';
import { GetPaymentFromExistingWalletDto } from './dto/get-payment-from-existing-wallet.dto';

@ApiTags('wallet')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('wallet')
export class WalletController {
  constructor(
    private readonly walletService: WalletService,
    private paymentAccountService: PaymentAccountService,
  ) {}

  @Get('transactions')
  @ApiOperation({ summary: 'Get wallet transactions by user' })
  @ApiResponse({ status: 200, description: 'Returns wallet transactions by user' })
  async getTransactionsByUser(@Req() req: Request, @Query('page') page = 1, @Query('limit') limit = 10) {
    const userId = req?.user?.userId;
    const pageNumber = Math.max(1, parseInt(String(page), 10) || 1);
    const limitNumber = Math.min(100, Math.max(1, parseInt(String(limit), 10) || 10));

    return await this.walletService.getTransactionsByUser(userId, limitNumber, pageNumber);
  }

  @Get('accounts')
  async getAccounts(@Req() req: Request, @Query('provider') provider?: string) {
    const userId = req?.user?.userId;
    const accounts = await this.paymentAccountService.getAccounts(
      userId,
      provider,
    );
    return {
      success: true,
      message: 'Accounts retrieved successfully',
      accounts: accounts,
    };
  }

  @Post('stripe/connect')
  async connectStripe(@Req() req: Request) {
    const userId = req?.user?.userId;
    return this.walletService.connectStripeAccount(userId);
  }

  @Post('default')
  async setDefaultAccount(
    @Body() dto: SetDefaultAccountDto,
    @Req() req: Request,
  ) {
    const userId = req?.user?.userId;
    return this.paymentAccountService.setDefaultAccount(userId, dto.accountId);
  }

  @Get('stripe/verification')
  async createVerificationSession(@Req() req: Request) {
    const userId = req?.user?.userId;
    return this.walletService.createVerificationSession(userId);
  }

  @Get('balance')
  @ApiOperation({ summary: 'Get wallet balance' })
  @ApiResponse({ status: 200, description: 'Returns wallet balance' })
  async getBalance(@Req() req: Request) {
    const userId = req?.user?.userId;
    const wallet = await this.walletService.getWallet(userId);
    return {
      success: true,
      message: 'Wallet balance retrieved successfully',
      balance: wallet.balance,
    };
  }

  // @Get('balance')
  // @ApiOperation({ summary: 'Get wallet balance' })
  // @ApiResponse({ status: 200, description: 'Returns wallet balance' })
  // async getBalanceByUserId() {
  //   // return StripePayment.checkBalance()
  // }

  @Post('deposit')
  @ApiOperation({ summary: 'Deposit funds to wallet' })
  @ApiResponse({ status: 201, description: 'Returns payment intent details' })
  async deposit(@Body() dto: DepositDto, @Req() req: Request) {
    dto.userId = req?.user?.userId;
    return this.walletService.depositFunds(dto);
  }

  // @Post('withdraw')
  // @ApiOperation({ summary: 'Withdraw funds from wallet' })
  // @ApiResponse({ status: 201, description: 'Initiates withdrawal process' })
  // async withdraw(@Body() dto: WithdrawDto, @Req() req: Request) {
  //   dto.userId = req?.user?.userId;
  //   return this.walletService.withdrawFunds(dto);
  // }

  // @Post('hold')
  // @ApiOperation({ summary: 'Hold funds for booking' })
  // @ApiResponse({ status: 201, description: 'Holds funds for booking' })
  // async holdFunds(@Body() dto: SpendDto) {
  //   return this.walletService.holdFunds(dto);
  // }

  // @Post('release/:bookingId')
  // @ApiOperation({ summary: 'Release held funds to provider' })
  // @ApiResponse({ status: 201, description: 'Releases funds to provider' })
  // async releaseFunds(
  //   @Param('bookingId') bookingId: string,
  //   @Query('providerId') providerId: string,
  //   @Query('amount') amount: number,
  // ) {
  //   return this.walletService.releaseFunds(bookingId, providerId, amount);
  // }

  // @Post('refund/:transactionId')
  // @ApiOperation({ summary: 'Refund a transaction' })
  // @ApiResponse({ status: 201, description: 'Refunds the transaction' })
  // async refund(@Param('transactionId') transactionId: string) {
  //   return this.walletService.refundTransaction(transactionId);
  // }

  // @Get('transactions/:userId')
  // @ApiOperation({ summary: 'Get wallet transactions' })
  // @ApiResponse({ status: 200, description: 'Returns wallet transactions' })
  // async getTransactions(
  //   @Param('userId') userId: string,
  //   @Query('limit') limit = 10,
  //   @Query('offset') offset = 0,
  // ) {
  //   return this.walletService.getTransactions(
  //     userId,
  //     Number(limit),
  //     Number(offset),
  //   );
  // }


  // // ----------------------
  // //        Add Card
  // // ----------------------

  // @Post('setup-intent')
  // async createSetupIntent(@Req() req: Request) {
  //   const userId = req?.user?.userId;
  //   // console.log(req?.user)
  //   return await this.walletService.createSetupIntent(userId);
  // }

  // @Get('cards')
  // listCards(@Req() req: Request) {
  //   const userId = req?.user?.userId;
  //   return this.walletService.listCards(userId);
  // }

  // @Post('cards/default')
  // setDefault(@Body() body: { paymentMethodId: string }, @Req() req: Request) {
  //   const userId = req?.user?.userId;
  //   return this.walletService.setDefaultCard(userId, body.paymentMethodId);
  // }

  // @Post('pay')
  // pay(@Body() body: { paymentMethodId: string; amountInCents: number; currency?: string }, @Req() req: Request) {
  //   const userId = req?.user?.userId;
  //   return this.walletService.payWithSavedCard(userId, body.paymentMethodId, body.amountInCents, body.currency);
  // }

  // @Post('cards/detach')
  // detach(@Body() body: { paymentMethodId: string }, @Req() req: Request) {
  //   const userId = req?.user?.userId;
  //   return this.walletService.detachCard(userId, body.paymentMethodId);
  // }

  @Post('pay')
  async payExistingBooking(@Body() dto: GetPaymentFromExistingWalletDto, @Req() req: Request) {
    const userId = req?.user?.userId;
    dto.user_id = userId;
    return this.walletService.completeBookingWithWallet(dto);
  }


}

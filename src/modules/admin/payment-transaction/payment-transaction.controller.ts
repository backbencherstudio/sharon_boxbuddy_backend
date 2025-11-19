import {
  Controller,
  Get,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { PaymentTransactionService } from './payment-transaction.service';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RolesGuard } from '../../../common/guard/role/roles.guard';
import { JwtAuthGuard } from '../../../modules/auth/guards/jwt-auth.guard';
import { Role } from '../../../common/guard/role/role.enum';
import { Roles } from '../../../common/guard/role/roles.decorator';
import { GetPaymentTransactionQueryDto } from './dto/query-payment-transaction.dto';

@ApiBearerAuth()
@ApiTags('Payment transaction')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin/payment-transaction')
export class PaymentTransactionController {
  constructor(
    private readonly paymentTransactionService: PaymentTransactionService,
  ) {}

  @ApiOperation({ summary: 'Get all payment transactions' })
  @Get()
  async findAll(@Query() query: GetPaymentTransactionQueryDto) {
    return this.paymentTransactionService.findAll(query);
  }

  @ApiOperation({ summary: 'Get payment transaction stats' })
  @Get('stats')
  async getStats() {
    return this.paymentTransactionService.getStats();
  }

  @ApiOperation({ summary: 'Get one payment transaction' })
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.paymentTransactionService.findOne(id);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.paymentTransactionService.remove(id);
  }
}

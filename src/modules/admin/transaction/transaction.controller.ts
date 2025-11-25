import {
  Controller,
  Get,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RolesGuard } from '../../../common/guard/role/roles.guard';
import { JwtAuthGuard } from '../../../modules/auth/guards/jwt-auth.guard';
import { Role } from '../../../common/guard/role/role.enum';
import { Roles } from '../../../common/guard/role/roles.decorator';
import { GetTransactionQueryDto } from './dto/query-transaction.dto';

@ApiBearerAuth()
@ApiTags('Transaction')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin/transaction')
export class TransactionController {
  constructor(
    private readonly transactionService: TransactionService,
  ) { }

  @ApiOperation({ summary: 'Get all transactions' })
  @Get()
  async findAll(@Query() query: GetTransactionQueryDto) {
    return this.transactionService.findAll(query);
  }

  @ApiOperation({ summary: 'Get transaction stats' })
  @Get('stats')
  async getStats() {
    return this.transactionService.getStats();
  }

  @ApiOperation({ summary: 'Get one transaction' })
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.transactionService.findOne(id);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.transactionService.remove(id);
  }
}

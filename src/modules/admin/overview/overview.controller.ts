import { Controller, Get, UseGuards, Query } from '@nestjs/common';
import { OverviewService } from './overview.service';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guard/role/roles.guard';
import { Roles } from 'src/common/guard/role/roles.decorator';
import { Role } from 'src/common/guard/role/role.enum';
import { ChartQueryDto } from './dto/query-overview.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin/overview')
export class OverviewController {
  constructor(private readonly overviewService: OverviewService) {}

  @Get('stats')
  getStats() {
    return this.overviewService.getStats();
  }
  @Get('chart')
  getChart(@Query() query: ChartQueryDto) {
    return this.overviewService.getChart(query);
  }
}

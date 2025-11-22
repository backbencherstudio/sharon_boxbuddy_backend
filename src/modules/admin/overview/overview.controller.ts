import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { OverviewService } from './overview.service';
import { CreateOverviewDto } from './dto/create-overview.dto';
import { UpdateOverviewDto } from './dto/update-overview.dto';
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

  @Post()
  create(@Body() CreateOverviewDto: CreateOverviewDto) {
    return this.overviewService.create(CreateOverviewDto);
  }

  @Get('stats')
  getStats() {
    return this.overviewService.getStats();
  }
  @Get('chart')
  getChart(@Query() query: ChartQueryDto) {
    return this.overviewService.getChart(query);
  }
}

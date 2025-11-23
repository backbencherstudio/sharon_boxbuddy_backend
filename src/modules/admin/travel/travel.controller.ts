import {
  Controller,
  Get,
  Param,
  Patch,
  UseGuards,
  Query,
} from '@nestjs/common';
import { TravelService } from './travel.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guard/role/roles.guard';
import { Roles } from '../../../common/guard/role/roles.decorator';
import { Role } from '../../../common/guard/role/role.enum';
import { GetTravelQueryDto } from './dto/query-travel.dto';

@ApiBearerAuth()
@ApiTags('Admin Travel')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin/travel')
export class TravelController {
  constructor(private readonly travelService: TravelService) {}

  @Get()
  findAll(@Query() query: GetTravelQueryDto) {
    return this.travelService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.travelService.findOne(id);
  }

  @Patch(':id/unpublished')
  cancel(@Param('id') id: string) {
    return this.travelService.unpublished(id);
  }
}

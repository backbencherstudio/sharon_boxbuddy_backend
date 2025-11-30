import { Controller, Get, Param, UseGuards, Query } from '@nestjs/common';
import { PackageService } from './package.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guard/role/roles.guard';
import { Roles } from '../../../common/guard/role/roles.decorator';
import { Role } from '../../../common/guard/role/role.enum';
import { GetPackageQueryDto } from './dto/query-package.dto';

@ApiBearerAuth()
@ApiTags('Admin Package')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin/package')
export class PackageController {
  constructor(private readonly packageService: PackageService) {}

  @Get()
  findAll(@Query() query: GetPackageQueryDto) {
    return this.packageService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.packageService.findOne(id);
  }
}

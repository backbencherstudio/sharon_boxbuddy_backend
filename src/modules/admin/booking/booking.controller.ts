import {
  Controller,
  Get,
  Param,
  UseGuards,
  Query,
  Patch,
  Body,
} from '@nestjs/common';
import { BookingService } from './booking.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guard/role/roles.guard';
import { Role } from 'src/common/guard/role/role.enum';
import { Roles } from 'src/common/guard/role/roles.decorator';
import { GetBookingQueryDto } from './dto/query-booking.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';

@ApiBearerAuth()
@ApiTags('Admin-Booking')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin/booking')
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @Get('stats')
  stats() {
    return this.bookingService.stats();
  }

  @Get()
  findAll(@Query() query: GetBookingQueryDto) {
    return this.bookingService.findAll(query);
  }

  @Get('problematic')
  findAllProblematic(@Query() query: GetBookingQueryDto) {
    // Pass problematic flag to use the same service method
    return this.bookingService.findAll({ ...query, problematic: true });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.bookingService.findOne(id);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() updateBookingStatusDto: UpdateBookingStatusDto,
  ) {
    return this.bookingService.updateStatus(id, updateBookingStatusDto.status);
  }
}

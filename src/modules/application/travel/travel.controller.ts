import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { TravelService } from './travel.service';
import { CreateTravelDto } from './dto/create-travel.dto';
import { UpdateTravelDto } from './dto/update-travel.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { Request } from 'express';

@ApiTags('Travel')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('travels')
export class TravelController {
  constructor(private readonly travelService: TravelService) {}

  @Post()
  async create(@Body() createTravelDto: CreateTravelDto, @Req() req: Request,) {
    try {
      createTravelDto.user_id = req?.user?.userId;
      return await this.travelService.create(createTravelDto);
    } catch (err) {
      return {
        success: false,
        message: 'travel creation failed',
      };
    }
  }

  @Get()
  async findAll() {
    return this.travelService.findAll();
  }

  @Get('my-current-travels')
  async myCurrentTravels(@Req() req: Request) {
    try {
      return await this.travelService.myCurrentTravels(req?.user?.userId);
    } catch (err) {
      return {
        success: false,
        message: 'travel fetch failed',
      };
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      return await this.travelService.findOne(id);
    } catch (err) {
      return {
        success: false,
        message: 'travel fetch failed',
      };
    }
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateTravelDto: UpdateTravelDto, @Req() req: Request) {
    try {
      return await this.travelService.update(id, updateTravelDto, req?.user?.userId);
    } catch (err) {
      return {
        success: false,
        message: 'travel update failed',
      };
    }
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req: Request) {
    try {
      return await this.travelService.remove(id, req?.user?.userId);
    } catch (err) {
      return {
        success: false,
        message: 'travel deletion failed',
      };
    }
  }
}

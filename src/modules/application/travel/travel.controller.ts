import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, Query, BadRequestException } from '@nestjs/common';
import { TravelService } from './travel.service';
import { CreateTravelDto } from './dto/create-travel.dto';
import { UpdateTravelDto } from './dto/update-travel.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { Request } from 'express';
import { FindAllDto } from './dto/find-all-query.dto';
import { AnnouncementRequestDto } from './dto/announcement-request.dto';
import { Public } from 'src/common/guard/public';
import { OptionalJwtAuthGuard } from 'src/modules/auth/guards/optional-jwt-auth.guard';

@ApiTags('Travel')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('travels')
export class TravelController {
  constructor(private readonly travelService: TravelService) { }

  @Post()
  async create(@Body() createTravelDto: CreateTravelDto, @Req() req: Request) {
    try {
      createTravelDto.user_id = req?.user?.userId;
      createTravelDto.publish = true;
      return await this.travelService.create(createTravelDto);
    } catch (err) {
      if(err instanceof BadRequestException) {
        return {
          success: false,
          message: err.message,
        };

      }else{
        return {
          success: false,
          message: 'travel creation failed',
        };
      }
      }
    }
  

    @Public()
    @UseGuards(OptionalJwtAuthGuard)
  @Get()
  async findAll(@Query() findAllDto: FindAllDto, @Req() req: Request) {
    try {
      const page = Math.max(1, parseInt(String(findAllDto.page), 10) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(String(findAllDto.limit), 10) || 10));
      findAllDto.page = page;
      findAllDto.limit = limit;
      return await this.travelService.findAll(findAllDto, req?.user?.userId);
    } catch (err) {
      return {
        success: false,
        message: 'travels fetch failed',
      };
    }
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

  @Get('my-current-travels-with-announcements')
  async myCurrentTravelsWithAnnounments(@Req() req: Request) {
    try {
      return await this.travelService.myCurrentTravelsWithAnnounments(req?.user?.userId);
    } catch (err) {
      return {
        success: false,
        message: 'travel fetch failed',
      };
    }
  }

  @Patch('request/:id/update')
  async updateRequest(@Param('id') id: string, @Req() req: Request,  @Body() announcementRequestDto: AnnouncementRequestDto) {
    try {
      return await this.travelService.updateRequest(id, req?.user?.userId, announcementRequestDto);
    } catch (err) {
      return {
        success: false,
        message: 'travel request accept failed',
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

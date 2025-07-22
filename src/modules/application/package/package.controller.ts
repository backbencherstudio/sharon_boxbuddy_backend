import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { CreatePackageDto } from './dto/create-package.dto';
import { UpdatePackageDto } from './dto/update-package.dto';
import { PackageService } from './package.service';

@ApiTags('Package')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('packages')
export class PackageController {
  constructor(private readonly packageService: PackageService) {}

  @Post()
  async create(
    @Body() createPackageDto: CreatePackageDto,
    @Req() req: Request,
  ) {
    try {
      createPackageDto.owner_id = req.user.userId;
      return await this.packageService.create(createPackageDto);
    } catch (error) {
      throw {
        success: false,
        message: 'package create failed',
      };
    }
  }

  @Get()
  async findAll() {
    try {
     return await this.packageService.findAll();
    } catch (error) {
      return {
        success: false,
        message: 'Retrive packages fail',
      };
    }
  }

  @Get('/my-packages')
  async findMyPackages(@Req() req: Request) {
    try {
      return await this.packageService.findMyPackages(req?.user?.userId);
    } catch (error) {
      throw {
        success: false,
        message: 'packages fetch failed',
      };
    }
  }

  // registered packages
  @Get('/registered-packages')
  async findRegisteredPackages(@Req() req: Request) {
    try {
      return await this.packageService.findRegisteredPackages(
        req?.user?.userId,
      );
    } catch (error) {
      throw {
        success: false,
        message: 'packages fetch failed',
      };
    }
  }


  // packages being processed
  @Get('/processing-packages')
  async findProcessingPackages(@Req() req: Request) {
    try {
      return await this.packageService.findProcessingPackages(
        req?.user?.userId,
      );
    } catch (error) {
      throw {
        success: false,
        message: 'packages fetch failed',
      };
    }
  }


  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      return await this.packageService.findOne(id);
    } catch (error) {
      throw {
        success: false,
        message: 'package fetch failed',
      };
    }
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updatePackageDto: UpdatePackageDto,
    @Req() req: Request,
  ) {
    try {
      return await this.packageService.update(
        id,
        updatePackageDto,
        req?.user?.userId,
      );
    } catch (error) {
      return {
        success: false,
        message: 'package update failed',
      };
    }
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req: Request) {
    try {
      return await this.packageService.remove(id, req?.user?.userId);
    } catch (error) {
      throw {
        success: false,
        message: 'package delete failed',
      };
    }
  }
}

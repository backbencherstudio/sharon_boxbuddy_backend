import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { CreatePackageDto } from './dto/create-package.dto';
import { UpdatePackageDto } from './dto/update-package.dto';
import { PackageService } from './package.service';
import { Public } from 'src/common/guard/public';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import appConfig from 'src/config/app.config';
import { OptionalJwtAuthGuard } from 'src/modules/auth/guards/optional-jwt-auth.guard';


@ApiTags('Package')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('packages')
export class PackageController {
  constructor(private readonly packageService: PackageService) { }


  // handle file

  @Post()
  @UseInterceptors(
    FileInterceptor('photo',
      {
        storage: diskStorage({
          destination:
            appConfig().storageUrl.rootUrl + appConfig().storageUrl.package,
          filename: (req, file, cb) => {
            const randomName = Array(32)
              .fill(null)
              .map(() => Math.round(Math.random() * 16).toString(16))
              .join('');
            return cb(
              null,
              `${randomName}${file.originalname.replace(/\s+/g, '-')}`,
            );
          },
        }
        ),
        // storage: memoryStorage(),
        limits: {
          fileSize: 5 * 1024 * 1024, // 5MB in bytes
        },
      }
    ),
  )
  async create(
    @Body() createPackageDto: CreatePackageDto,
    @Req() req: Request,
    @UploadedFile() photo: Express.Multer.File,
  ) {
    try {
      createPackageDto.owner_id = req.user.userId;
      if (photo) {
        createPackageDto.photo = photo.filename;
      }
      return await this.packageService.create(createPackageDto);
    } catch (error) {
      if (error instanceof BadRequestException) {
        return {
          success: false,
          message: error.message,
        };
      } else {
        return {
          success: false,
          message: 'package create failed',
        };
      }

    }

}

@Public()
@UseGuards(OptionalJwtAuthGuard)
@Get()
async findAll(@Query() query: { page?: number, limit?: number }, @Req() req: Request) {
  try {
    const page = Math.max(1, parseInt(String(query.page), 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(String(query.limit), 10) || 10));
    return await this.packageService.findAll({ page, limit }, req?.user?.userId);
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
@UseInterceptors(
  FileInterceptor('photo',
    {
      storage: diskStorage({
        destination:
          appConfig().storageUrl.rootUrl + appConfig().storageUrl.package,
        filename: (req, file, cb) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          return cb(
            null,
            `${randomName}${file.originalname.replace(/\s+/g, '-')}`,
          );
        },
      }
      ),
      // storage: memoryStorage(),
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB in bytes
      },
    }
  ),
)
async update(
  @Param('id') id: string,
  @Body() updatePackageDto: UpdatePackageDto,
  @Req() req: Request,
  @UploadedFile() photo: Express.Multer.File,
) {
  try {
    if (photo) {
      updatePackageDto.photo = photo.filename;
    }
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

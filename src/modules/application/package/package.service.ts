import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreatePackageDto } from './dto/create-package.dto';
import { UpdatePackageDto } from './dto/update-package.dto';
import { SojebStorage } from 'src/common/lib/Disk/SojebStorage';
import appConfig from 'src/config/app.config';

@Injectable()
export class PackageService {
  constructor(private readonly prisma: PrismaService) { }

  private parseWeight(input: string, defaultValue = 0) {
    if (!input || typeof input !== 'string') {
      return defaultValue;
    }

    const numericString = input.toLowerCase().replace(/kg/g, '').trim();
    const number = parseFloat(numericString);

    return isNaN(number) ? defaultValue : number;
  }

  async create(createPackageDto: CreatePackageDto) {

    try {
      if (createPackageDto.weight) {
        // calculate booking amount
        const weight = this.parseWeight(createPackageDto.weight)
        if (!weight) throw new BadRequestException("Your package weight is missing or in wrong format. Format should be like 1kg, 2kg, 3kg, etc.")
      }

      const packageData = await this.prisma.package.create({
        data: createPackageDto as any,
      });


      if (createPackageDto.photo) {
        packageData['photo_url'] = SojebStorage.url(
          appConfig().storageUrl.package + createPackageDto.photo,
        );
      }
      return {
        success: true,
        message: 'package created successfully',
        data: packageData,
      };
    } catch (error) {
      // if error then delete the photo from storage and throw the error
      if (createPackageDto.photo) {
        await SojebStorage.delete(appConfig().storageUrl.package + createPackageDto.photo);
      }
      throw error;
    }



  }

  async findMyPackages(owner_id: string) {
    try {
      const packages = await this.prisma.package.findMany({
        where: {
          owner_id: owner_id,
          status: 'pending',
        },
      });

      packages.forEach((packageData) => {
        if (packageData.photo) {
          packageData['photo_url'] = SojebStorage.url(
            appConfig().storageUrl.package + packageData.photo,
          );
        }
      });
      return {
        success: true,
        message: 'packages fetched successfully',
        data: packages,
      };
    } catch (err) {
      return {
        success: false,
        message: 'packages fetch failed',
      };
    }
  }

  async findAll(
    { page, limit }: { page?: number; limit?: number },
    userId?: string,
  ) {
    try {
      const where = {
        publish: true,
        status: 'pending',
      };

      // console.log(userId)
      if (userId) {
        where['owner_id'] = {
          not: userId,
        };
      }


      const packages = await this.prisma.package.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
      });

      packages.forEach((packageData) => {
        if (packageData.photo) {
          packageData['photo_url'] = SojebStorage.url(
            appConfig().storageUrl.package + packageData.photo,
          );
        }
      });

      const total = await this.prisma.package.count({
        where: where,
      });
      const totalPages = Math.ceil(total / limit);
      const hasNextPage = page * limit < total;
      const hasPreviousPage = page > 1;

      return {
        success: true,
        message: 'packages fetched successfully',
        data: packages,
        pagination: {
          total,
          totalPages,
          currentPage: page,
          limit: limit,
          hasNextPage,
          hasPreviousPage,
        },
      };
    } catch (err) {
      return {
        success: false,
        message: 'packages fetch failed',
      };
    }
  }

  async findPackagesHistory(query: { page?: number, limit?: number }, userId: string) {
    try {
      const { page, limit } = query;

      const where = {
        owner_id: userId,
        status: 'completed',

      };

      const packages = await this.prisma.package.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
      });

      packages.forEach((packageData) => {
        if (packageData.photo) {
          packageData['photo_url'] = SojebStorage.url(
            appConfig().storageUrl.package + packageData.photo,
          );
        }
      });

      const total = await this.prisma.package.count({ where });
      const totalPages = Math.ceil(total / limit);
      const hasNextPage = page * limit < total;
      const hasPreviousPage = page > 1;

      return {
        success: true,
        message: 'packages history fetched successfully',
        data: packages,
        pagination: {
          total,
          totalPages,
          currentPage: page,
          limit: limit,
          hasNextPage,
          hasPreviousPage,
        },
      };
     
    } catch (err) {
      return {
        success: false,
        message: 'packages history fetch failed',
      };
    }
  }

  async findRegisteredPackages(userId: string) {
    try {
      const packages = await this.prisma.package.findMany({
        where: {
          owner_id: userId,
          publish: false,
          status: 'pending',
        },
      });

      packages.forEach((packageData) => {
        if (packageData.photo) {
          packageData['photo_url'] = SojebStorage.url(
            appConfig().storageUrl.package + packageData.photo,
          );
        }
      });
      return {
        success: true,
        message: 'packages fetched successfully',
        data: packages,
      };
    } catch (err) {
      return {
        success: false,
        message: 'packages fetch failed',
      };
    }
  }

  async findProcessingPackages(userId: string) {
    try {
      const packages = await this.prisma.package.findMany({
        where: {
          owner_id: userId,
          publish: true,
          status: 'pending',
        },
      });

      packages.forEach((packageData) => {
        if (packageData.photo) {
          packageData['photo_url'] = SojebStorage.url(
            appConfig().storageUrl.package + packageData.photo,
          );
        }
      });
      return {
        success: true,
        message: 'packages fetched successfully',
        data: packages,
      };
    } catch (err) {
      return {
        success: false,
        message: 'packages fetch failed',
      };
    }
  }

  async findOne(id: string) {
    try {
      const packageData = await this.prisma.package.findUnique({
        where: { id: id },
        include: {
          owner: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              name: true,
              email: true,
              phone_number: true,
            },
          },
          bookings: true,
        },
      });
      if (!packageData) {
        return {
          success: false,
          message: 'package not found',
        };
      }

      // packageData.bookings = packageData.bookings.filter(
      //   (booking) => booking.status === 'in_progress',
      // );

      const bookings =
        packageData.bookings?.length > 0
          ? packageData.bookings[packageData.bookings.length - 1]
          : {};
      delete packageData.bookings;
      packageData['booking'] = bookings;

      if (packageData.photo) {
        packageData['photo_url'] = SojebStorage.url(
          appConfig().storageUrl.package + packageData.photo,
        );
      }
      return {
        success: true,
        message: 'package fetched successfully',
        data: packageData,
      };
    } catch (err) {
      return {
        success: false,
        message: 'package fetch failed',
      };
    }
  }

  async update(
    id: string,
    updatePackageDto: UpdatePackageDto,
    owner_id: string,
  ) {
    try {
      const packageData = await this.prisma.package.findUnique({
        where: { id: id, owner_id: owner_id },
      });

      if (!packageData) {
        return {
          success: false,
          message: 'package not found',
        };
      }
      const updatedPackageData = await this.prisma.package.update({
        where: { id: id, owner_id: owner_id },
        data: updatePackageDto as any,
      });

      if (updatedPackageData.photo) {
        updatedPackageData['photo_url'] = SojebStorage.url(
          appConfig().storageUrl.package + updatedPackageData.photo,
        );
      }
      return {
        success: true,
        message: 'package updated successfully',
        data: updatedPackageData,
      };
    } catch (err) {
      return {
        success: false,
        message: 'package update failed',
      };
    }
  }

  async remove(id: string, owner_id: string) {
    try {
      const packageData = await this.prisma.package.findUnique({
        where: { id: id, owner_id: owner_id },
      });

      if (!packageData) {
        return {
          success: false,
          message: 'package not found',
        };
      }

      await this.prisma.package.delete({
        where: { id: id },
      });
      return {
        success: true,
        message: 'package deleted successfully',
      };
    } catch (err) {
      return {
        success: false,
        message: 'package delete failed',
      };
    }
  }
}

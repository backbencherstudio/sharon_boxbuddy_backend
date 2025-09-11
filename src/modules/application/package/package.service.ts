import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreatePackageDto } from './dto/create-package.dto';
import { UpdatePackageDto } from './dto/update-package.dto';

@Injectable()
export class PackageService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createPackageDto: CreatePackageDto) {
    try {
      const packageData = await this.prisma.package.create({
        data: createPackageDto as any,
      });
      return {
        success: true,
        message: 'package created successfully',
        data: packageData,
      };
    } catch (err) {
      return {
        success: false,
        message: 'package create failed',
      };
    }
  }

  async findMyPackages(owner_id: string) {
    try {
      const packages = await this.prisma.package.findMany({
        where: {
          owner_id: owner_id,
        },
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
        status: 'new',
      };

      console.log(userId)
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

      const total = await this.prisma.travel.count();
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

  async findRegisteredPackages(userId: string) {
    try {
      const packages = await this.prisma.package.findMany({
        where: {
          owner_id: userId,
          publish: false,
        },
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
        },
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

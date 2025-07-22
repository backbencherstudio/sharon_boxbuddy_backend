import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreatePackageDto } from './dto/create-package.dto';
import { UpdatePackageDto } from './dto/update-package.dto';

@Injectable()
export class PackageService {
  constructor(private readonly prisma: PrismaService) { }

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

  async findAll() {
    try {
      const packages = await this.prisma.package.findMany({
        where: {
          publish: true,
          status: 'new'
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
      });
      if (!packageData) {
        return {
          success: false,
          message: 'package not found',
        };
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

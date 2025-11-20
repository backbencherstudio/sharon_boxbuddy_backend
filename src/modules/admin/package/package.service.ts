import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { GetPackageQueryDto } from './dto/query-package.dto';

@Injectable()
export class PackageService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: GetPackageQueryDto) {
    const { q, status, limit = 10, page = 1 } = query;
    const where_condition = {};
    if (q) {
      where_condition['OR'] = [
        { pick_up_location: { contains: q, mode: 'insensitive' } },
        { drop_off_location: { contains: q, mode: 'insensitive' } },
        { category: { has: q } },
      ];
    }

    if (status) {
      where_condition['status'] = status;
    }

    const take = limit;
    const skip = (page - 1) * limit;

    const packages = await this.prisma.package.findMany({
      where: where_condition,
      include: {
        owner: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
          },
        },
      },
      take: take,
      skip: skip,
    });
    const total = await this.prisma.package.count({ where: where_condition });

    return {
      success: true,
      data: {
        packages,
        total,
        page,
        limit,
      },
    };
  }

  async findOne(id: string) {
    const pkg = await this.prisma.package.findUnique({
      where: { id },
      include: {
        owner: true,
        bookings: true,
        reports: true,
      },
    });
    return {
      success: true,
      data: pkg,
    };
  }
}

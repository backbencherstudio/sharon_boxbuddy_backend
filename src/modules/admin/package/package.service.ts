import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { GetPackageQueryDto } from './dto/query-package.dto';

@Injectable()
export class PackageService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: GetPackageQueryDto) {
    const { q, status, limit = 10, page = 1, owner_id } = query;
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

    if (owner_id) {
      where_condition['owner_id'] = owner_id;
    }

    const take = limit;
    const skip = (page - 1) * limit;

    const packages = await this.prisma.package.findMany({
      where: where_condition,
      select: {
        id: true,
        pick_up_location: true,
        drop_off_location: true,
        category: true,
        status: true,
        weight: true,
        value: true,
        created_at: true,
        owner: {
          select: {
            first_name: true,
            last_name: true,
          },
        },
      },
      take: take,
      skip: skip,
      orderBy: {
        created_at: 'desc',
      },
    });
    const total = await this.prisma.package.count({ where: where_condition });

    // Format for table display
    const formattedPackages = packages.map((pkg) => ({
      id: pkg.id,
      route: `${pkg.pick_up_location} → ${pkg.drop_off_location}`,
      category: pkg.category.join(', '),
      status: pkg.status,
      weight: pkg.weight,
      value: pkg.value,
      owner_name: `${pkg.owner.first_name} ${pkg.owner.last_name}`,
      created_at: pkg.created_at,
    }));

    return {
      success: true,
      data: {
        packages: formattedPackages,
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

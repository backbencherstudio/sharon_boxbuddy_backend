import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { GetPackageQueryDto } from './dto/query-package.dto';

@Injectable()
export class PackageService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: GetPackageQueryDto) {
    const { q, status, limit = 10, page = 1, owner_id } = query;
    const where_condition: any = {};

    // Search in package fields AND owner name/email
    if (q) {
      // First, find users matching the search query
      const matchingUsers = await this.prisma.user.findMany({
        where: {
          OR: [
            { first_name: { contains: q, mode: 'insensitive' } },
            { last_name: { contains: q, mode: 'insensitive' } },
            { email: { contains: q, mode: 'insensitive' } },
          ],
        },
        select: { id: true },
      });

      const userIds = matchingUsers.map((user) => user.id);

      // Search in package fields and matching owner_ids
      where_condition['OR'] = [
        { pick_up_location: { contains: q, mode: 'insensitive' } },
        { drop_off_location: { contains: q, mode: 'insensitive' } },
        { category: { has: q } },
        ...(userIds.length > 0 ? [{ owner_id: { in: userIds } }] : []),
      ];
    }

    if (status) {
      where_condition['status'] = status;
    }

    if (owner_id) {
      where_condition['owner_id'] = owner_id;
    }

    const skip = (page - 1) * limit;

    const [packages, total] = await Promise.all([
      this.prisma.package.findMany({
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
        take: limit,
        skip,
        orderBy: {
          created_at: 'desc',
        },
      }),
      this.prisma.package.count({ where: where_condition }),
    ]);

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
      message: 'Packages retrieved successfully',
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
      message: 'Package retrieved successfully',
      data: pkg,
    };
  }
}

import { Injectable } from '@nestjs/common';
import { CreateAnalyticsDto } from './dto/create-analytics.dto';
import { UpdateAnalyticsDto } from './dto/update-analytics.dto';
import { ChartQueryDto } from './dto/query-analytics.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}
  create(createAnalyticsDto: CreateAnalyticsDto) {
    return 'This action adds a new analytics';
  }

  async getChart(query?: ChartQueryDto) {
    const period = query.period || 'week';
    let data;

    switch (period) {
      // ================= WEEK =================
      case 'week':
        data = await this.prisma.$queryRaw`
        SELECT 
          DATE(created_at) AS date,
          SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) AS total_earnings,
          COUNT(*) AS total_bookings
        FROM bookings
        WHERE created_at >= NOW() - INTERVAL '7 days'
        GROUP BY DATE(created_at)
        ORDER BY DATE(created_at);
      `;
        break;

      // ================= MONTH =================
      case 'month':
        data = await this.prisma.$queryRaw`
        SELECT
          DATE(created_at - ((EXTRACT(day FROM created_at)::int % 3) || ' days')::interval) AS day_group,
          SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) AS total_earnings,
          COUNT(*) AS total_bookings
        FROM bookings
        WHERE created_at >= NOW() - INTERVAL '1 month'
        GROUP BY day_group
        ORDER BY day_group;
      `;
        break;

      // ================= YEAR =================
      case 'year':
        data = await this.prisma.$queryRaw`
        SELECT 
          DATE_TRUNC('month', created_at) AS month,
          SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) AS total_earnings,
          COUNT(*) AS total_bookings
        FROM bookings
        WHERE created_at >= NOW() - INTERVAL '1 year'
        GROUP BY DATE_TRUNC('month', created_at)
        ORDER BY DATE_TRUNC('month', created_at);
        `;

        break;

      default:
        throw new Error('Invalid period');
    }

    return {
      success: true,
      message: 'Chart data fetched successfully',
      data: {
        period,
        data,
      },
    };
  }

  async getStats() {
    const totalUsers = await this.prisma.user.count();
    const totalBookings = await this.prisma.booking.count();
    const totalEarnings = await this.prisma.booking.aggregate({
      where: {
        status: 'completed',
      },
      _sum: {
        amount: true,
      },
    });
    const platformWallet = await this.prisma.platformWallet.findFirst({
      select: {
        total_earnings: true,
      },
    });

    return {
      success: true,
      message: 'Stats fetched successfully',
      data: {
        total_users: totalUsers,
        total_bookings: totalBookings,
        total_earnings: totalEarnings._sum.amount || 0,
        total_revenue: +platformWallet?.total_earnings || 0,
      },
    };
  }

  findOne(id: number) {
    return `This action returns a #${id} analytics`;
  }

  update(id: number, updateAnalyticsDto: UpdateAnalyticsDto) {
    return `This action updates a #${id} analytics`;
  }

  remove(id: number) {
    return `This action removes a #${id} analytics`;
  }
}

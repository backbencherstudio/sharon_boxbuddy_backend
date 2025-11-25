import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { GetPaymentTransactionQueryDto } from './dto/query-payment-transaction.dto';

@Injectable()
export class PaymentTransactionService {
  constructor(private prisma: PrismaService) { }

  async findAll(query: GetPaymentTransactionQueryDto) {
    const {
      q,
      status,
      limit = 10,
      page = 1,
      user_id,
      provider,
    } = query;
    const where_condition = {};

    if (q) {
      where_condition['OR'] = [
        { reference_number: { contains: q, mode: 'insensitive' } },
        { user: { first_name: { contains: q, mode: 'insensitive' } } },
        { user: { last_name: { contains: q, mode: 'insensitive' } } },
        { user: { email: { contains: q, mode: 'insensitive' } } },
      ];
    }

    if (status) {
      where_condition['status'] = status;
    }

    if (user_id) {
      where_condition['user_id'] = user_id;
    }

    if (provider) {
      where_condition['provider'] = provider;
    }

    const take = limit;
    const skip = (page - 1) * limit;

    const paymentTransactions = await this.prisma.paymentTransaction.findMany({
      where: where_condition,
      include: {
        user: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
          },
        },
      },
      take: take,
      skip: skip,
      orderBy: {
        created_at: 'desc',
      },
    });

    const total = await this.prisma.paymentTransaction.count({
      where: where_condition,
    });

    return {
      success: true,
      data: {
        paymentTransactions,
        total,
        page,
        limit,
      },
    };
  }

  async findOne(id: string) {
    const paymentTransaction =
      await this.prisma.paymentTransaction.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              email: true,
            },
          },
        },
      });

    if (!paymentTransaction) {
      return {
        success: false,
        message: 'Payment transaction not found',
      };
    }

    return {
      success: true,
      data: paymentTransaction,
    };
  }

  async remove(id: string) {
    const paymentTransaction =
      await this.prisma.paymentTransaction.findUnique({
        where: { id },
      });

    if (!paymentTransaction) {
      return {
        success: false,
        message: 'Payment transaction not found',
      };
    }

    await this.prisma.paymentTransaction.delete({
      where: { id },
    });

    return {
      success: true,
      message: 'Payment transaction deleted successfully',
    };
  }

  async getStats() {
    const totalTransactions = await this.prisma.paymentTransaction.count();
    const totalAmount = await this.prisma.paymentTransaction.aggregate({
      _sum: {
        amount: true,
      },
    });

    const statusCounts = await this.prisma.paymentTransaction.groupBy({
      by: ['status'],
      _count: {
        status: true,
      },
    });

    return {
      success: true,
      data: {
        totalTransactions,
        totalAmount: totalAmount._sum.amount,
        statusCounts: statusCounts.map((statusCount) => ({
          status: statusCount.status,
          count: statusCount._count.status,
        })),
      },
    };
  }
}

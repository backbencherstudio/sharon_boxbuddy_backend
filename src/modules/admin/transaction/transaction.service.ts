import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { GetTransactionQueryDto } from './dto/query-transaction.dto';

@Injectable()
export class TransactionService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: GetTransactionQueryDto) {
    const { q, status, limit = 10, page = 1, user_id, type } = query;
    const where_condition: any = {};

    // Search in reference_id AND user name/email
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

      // Search in both reference_id and matching user_ids
      where_condition['OR'] = [
        { reference_id: { contains: q, mode: 'insensitive' } },
        ...(userIds.length > 0 ? [{ user_id: { in: userIds } }] : []),
      ];
    }

    if (status) {
      where_condition['status'] = status;
    }

    if (user_id) {
      where_condition['user_id'] = user_id;
    }

    if (type) {
      where_condition['type'] = type;
    }

    const skip = (page - 1) * limit;

    const [transactions, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where: where_condition,
        select: {
          id: true,
          type: true,
          amount: true,
          status: true,
          reference_id: true,
          user_id: true,
          created_at: true,
        },
        take: limit,
        skip,
        orderBy: {
          created_at: 'desc',
        },
      }),
      this.prisma.transaction.count({ where: where_condition }),
    ]);

    // Fetch user details for table display
    const formattedTransactions = await Promise.all(
      transactions.map(async (transaction) => {
        const user = await this.prisma.user.findUnique({
          where: { id: transaction.user_id },
          select: {
            first_name: true,
            last_name: true,
            email: true,
          },
        });

        return {
          id: transaction.id,
          type: transaction.type,
          amount: transaction.amount,
          status: transaction.status,
          reference_id: transaction.reference_id,
          user_name: user ? `${user.first_name} ${user.last_name}` : 'N/A',
          user_email: user?.email || 'N/A',
          created_at: transaction.created_at,
        };
      }),
    );

    return {
      success: true,
      message: 'Transactions retrieved successfully',
      data: {
        transactions: formattedTransactions,
        total,
        page,
        limit,
      },
    };
  }

  async findOne(id: string) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id },
      select: {
        id: true,
        type: true,
        amount: true,
        status: true,
        description: true,
        reference_id: true,
        user_id: true,
        wallet_id: true,
        booking_id: true,
        created_at: true,
        updated_at: true,
      },
    });

    if (!transaction) {
      return {
        success: false,
        message: 'Transaction not found',
      };
    }

    // Fetch user details
    const user = await this.prisma.user.findUnique({
      where: { id: transaction.user_id },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
      },
    });

    return {
      success: true,
      message: 'Transaction retrieved successfully',
      data: {
        ...transaction,
        user,
      },
    };
  }

  async remove(id: string) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id },
    });

    if (!transaction) {
      return {
        success: false,
        message: 'Transaction not found',
      };
    }

    await this.prisma.transaction.delete({
      where: { id },
    });

    return {
      success: true,
      message: 'Transaction deleted successfully',
    };
  }

  async getStats() {
    const totalTransactions = await this.prisma.transaction.count();
    const totalAmount = await this.prisma.transaction.aggregate({
      _sum: {
        amount: true,
      },
    });

    const statusCounts = await this.prisma.transaction.groupBy({
      by: ['status'],
      _count: {
        status: true,
      },
    });

    return {
      success: true,
      message: 'Transaction stats retrieved successfully',
      data: {
        totalTransactions,
        totalAmount: +totalAmount._sum.amount,
        statusCounts: statusCounts.map((statusCount) => ({
          status: statusCount.status,
          count: statusCount._count.status,
        })),
      },
    };
  }
}

import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class PaymentAccountService {
  constructor(private prisma: PrismaService) {}

  async createAccount(
    userId: string,
    provider: string,
    accountId: string,
    metadata?: any
  ) {
    return this.prisma.paymentAccount.create({
      data: {
        user_id: userId,
        provider,
        account_id: accountId,
        metadata,
      },
    });
  }

  async getAccounts(userId: string, provider?: string) {
    return this.prisma.paymentAccount.findMany({
      where: {
        user_id: userId,
        ...(provider ? { provider } : {}),
      },
      orderBy: { is_default: 'desc' },
    });
  }

  async setDefaultAccount(userId: string, accountId: string) {
    await this.prisma.$transaction([
      // Reset all defaults
      this.prisma.paymentAccount.updateMany({
        where: { user_id: userId },
        data: { is_default: false },
      }),
      // Set new default
      this.prisma.paymentAccount.update({
        where: { id: accountId },
        data: { is_default: true },
      }),
    ]);
  }
}
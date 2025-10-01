// platform-wallet.service.ts
import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';


@Injectable()
export class PlatformWalletService implements OnModuleInit {
  private readonly logger = new Logger(PlatformWalletService.name);

  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    await this.bootstrapPlatformWallet();
  }

  private async bootstrapPlatformWallet() {
    try {
      const existingWallet = await this.prisma.platformWallet.findFirst();
      
      if (!existingWallet) {
        const newWallet = await this.prisma.platformWallet.create({
          data: { totalEarnings: 0 }
        });
        this.logger.log('Platform wallet created successfully');
        this.logger.log(`Wallet ID: ${newWallet.id}`);
      } else {
        this.logger.log('Platform wallet already exists');
      }
    } catch (error) {
      this.logger.error('Failed to bootstrap platform wallet:', error);
      throw error;
    }
  }

  async getPlatformWallet() {
    const wallet = await this.prisma.platformWallet.findFirstOrThrow({
      where: { id: { not: undefined } } // Ensures we get the first record
    });

    return {
      success: true,
      message: "Plartform wallet retrived successfully",
      data: wallet.totalEarnings
    }
  }

  
}
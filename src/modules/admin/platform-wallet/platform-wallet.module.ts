import { Module } from '@nestjs/common';
import { PlatformWalletService } from './platform-wallet.service';
import { PlatformWalletController } from './platform-wallet.controller';

@Module({
  controllers: [PlatformWalletController],
  providers: [PlatformWalletService],
})
export class PlatformWalletModule {}

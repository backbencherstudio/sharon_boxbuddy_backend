import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { PlatformWalletService } from './platform-wallet.service';
import { CreatePlatformWalletDto } from './dto/create-platform-wallet.dto';
import { UpdatePlatformWalletDto } from './dto/update-platform-wallet.dto';
import { Roles } from 'src/common/guard/role/roles.decorator';
import { Role } from 'src/common/guard/role/role.enum';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('admin/platform-wallet')
export class PlatformWalletController {
  constructor(private readonly platformWalletService: PlatformWalletService) {}
  
  @Roles(Role.ADMIN)
  @Get()
  async find() {
    return await this.platformWalletService.getPlatformWallet();
  }

}

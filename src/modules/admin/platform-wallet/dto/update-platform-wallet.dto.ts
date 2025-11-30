import { PartialType } from '@nestjs/swagger';
import { CreatePlatformWalletDto } from './create-platform-wallet.dto';

export class UpdatePlatformWalletDto extends PartialType(
  CreatePlatformWalletDto,
) {}

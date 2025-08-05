import { IsBoolean, IsObject, IsString } from 'class-validator';

export class CreatePaymentAccountDto {
  @IsString()
  provider: string; // 'stripe', 'paypal', etc.

  @IsString()
  accountId: string;

  @IsObject()
  metadata?: Record<string, any>;
}

export class SetDefaultAccountDto {
  @IsString()
  accountId: string;

  @IsBoolean()
  isDefault: boolean;
}
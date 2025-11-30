import { IsNumber, IsPositive, IsString } from 'class-validator';

export class DepositDto {
  userId?: string;

  @IsNumber()
  @IsPositive()
  amount: number;

  @IsString()
  paymentMethodId?: string;
}

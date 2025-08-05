import { IsNumber, IsPositive, IsString } from 'class-validator';

export class WithdrawDto {
  
  userId?: string;

  @IsNumber()
  @IsPositive()
  amount: number;

  @IsString()
  destinationAccountId: string;
}
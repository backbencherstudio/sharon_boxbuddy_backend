import { IsNumber, IsPositive, IsString } from 'class-validator';

export class SpendDto {
  @IsString()
  userId: string;

  @IsNumber()
  @IsPositive()
  amount: number;

  @IsString()
  bookingId: string;
}

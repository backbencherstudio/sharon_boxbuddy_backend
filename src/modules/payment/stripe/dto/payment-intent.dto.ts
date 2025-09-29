import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class PaymentIntentDto {

  @IsString()
  @IsNotEmpty()
  bookingId: string

  // @IsNumber()
  // @IsNotEmpty()
  // amount: number; // Amount in cents (e.g., 1000 for $10.00)
}
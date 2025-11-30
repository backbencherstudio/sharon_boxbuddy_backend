// src/payments/dto/process-payment.dto.ts
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class ProcessPaymentDto {
  @IsString()
  @IsNotEmpty()
  paymentMethodId: string;

  @IsString()
  @IsNotEmpty()
  bookingId: string;

  // @IsNumber()
  // @IsNotEmpty()
  // amount: number; // Amount in cents (e.g., 1000 for $10.00)
}

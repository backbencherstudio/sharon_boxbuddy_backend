// src/payments/dto/create-payment.dto.ts
import { IsNotEmpty, IsString } from 'class-validator';

export class SaveCardDto {
  @IsString()
  @IsNotEmpty()
  paymentMethodId: string;
}

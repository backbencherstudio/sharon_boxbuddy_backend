// create dto for get payment from existing wallet
import { IsOptional, IsString, IsNotEmpty } from 'class-validator';

export class GetPaymentFromExistingWalletDto {

 @IsOptional()
  @IsString()
  user_id: string;

  @IsNotEmpty()
  @IsString()
  booking_id: string;
}
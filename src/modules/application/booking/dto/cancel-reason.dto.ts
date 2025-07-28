import { IsNotEmpty } from 'class-validator';

export class CancelReasonDto {
  @IsNotEmpty()
  cancel_reason: any;  // This ensures cancel_reason is mandatory and can be any type (string, object, array, etc.)
}

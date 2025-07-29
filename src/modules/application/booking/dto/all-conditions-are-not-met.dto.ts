import { IsNotEmpty, IsOptional } from 'class-validator';

export class AllConditionsAreNotMetDto {
  @IsNotEmpty()
  all_conditions_are_not_met_reason: any;  // This ensures cancel_reason is mandatory and can be any type (string, object, array, etc.)

  @IsOptional()
  report_details?: string
}

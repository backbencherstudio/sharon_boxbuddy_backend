import { IsOptional, IsDateString } from 'class-validator';

export class FindAllDto {
  @IsOptional()
  @IsDateString()  // Validates that the value is a proper date string if it's provided
  arrival?: string; // Optional field for arrival date

  @IsOptional()
  @IsDateString()  // Validates that the value is a proper date string if it's provided
  departure?: string; // Optional field for departure date
}

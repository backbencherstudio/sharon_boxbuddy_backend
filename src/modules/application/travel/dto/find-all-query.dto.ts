import { IsOptional, IsDateString } from 'class-validator';

export class FindAllDto {
  @IsOptional()
  @IsDateString() // Validates that the value is a proper date string if it's provided
  arrival?: string; // Optional field for arrival date

  @IsOptional()
  @IsDateString() // Validates that the value is a proper date string if it's provided
  departure?: string; // Optional field for departure date

  // page number and limit per page
  @IsOptional()
  page?: number; // Optional field for page number

  @IsOptional()
  limit?: number; // Optional field for limit per page

  @IsOptional()
  arrival_to?: string; // Optional field for arrival to

  @IsOptional()
  departure_from?: string; // Optional field for departure from
}

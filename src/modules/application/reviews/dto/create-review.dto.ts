import { IsString, IsInt, Min, Max, IsNotEmpty } from 'class-validator';

export class CreateReviewDto {
 @IsNotEmpty()
  @IsString()
  review_text: string;

  @IsNotEmpty()
  @IsInt()
  @Min(1, { message: 'Rating must be at least 1' })
  @Max(5, { message: 'Rating cannot exceed 5' })
  rating: number;

  @IsNotEmpty()
  @IsString()
  booking_id: string; // The booking associated with the review
}
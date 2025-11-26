import { IsNotEmpty } from 'class-validator';

export class ProblemWithPackageDto {
  @IsNotEmpty()
  problem_reason: any; // This ensures cancel_reason is mandatory and can be any type (string, object, array, etc.)

  problem_photo: string;
}

import { Transform } from 'class-transformer';
import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';
import { BookingStatus } from '@prisma/client';

export class GetBookingQueryDto {
  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsString()
  status?: BookingStatus;

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  limit?: number;

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  page?: number;

  @IsOptional()
  @IsString()
  user_id?: string;

  @IsOptional()
  @IsString()
  package_id?: string;

  @IsOptional()
  @IsString()
  travel_id?: string;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  problematic?: boolean;
}

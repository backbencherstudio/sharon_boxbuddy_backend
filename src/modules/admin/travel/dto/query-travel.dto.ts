import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsString, IsIn, IsNumber } from 'class-validator';

export class GetTravelQueryDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  q: string;

  @ApiProperty({ required: false, enum: ['active', 'upcoming', 'completed'] })
  @IsOptional()
  @IsString()
  @IsIn(['active', 'upcoming', 'completed'])
  status: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  limit: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  page: number;
}

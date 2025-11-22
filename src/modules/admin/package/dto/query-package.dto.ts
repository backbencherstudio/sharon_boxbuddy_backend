import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsString, IsIn, IsNumber } from 'class-validator';

export class GetPackageQueryDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  q: string;

  @ApiProperty({
    required: false,
    enum: ['new', 'pending', 'in_progress', 'completed', 'rejected'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['new', 'pending', 'in_progress', 'completed', 'rejected'])
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

  @IsOptional()
  @IsString()
  owner_id?: string;
}

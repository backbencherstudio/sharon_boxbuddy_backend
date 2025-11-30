import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsString, IsNotEmpty, IsNumber } from 'class-validator';

export class QueryDto {
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @IsNotEmpty()
  id: number; // ID of the package owner
}

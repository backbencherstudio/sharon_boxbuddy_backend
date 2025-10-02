import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsString, IsNotEmpty, IsNumber } from 'class-validator';

export class SummaryDto {
  @IsString()
  @IsNotEmpty()
  summary: string; 
}

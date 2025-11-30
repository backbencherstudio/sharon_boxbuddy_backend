import { IsEnum, IsOptional } from 'class-validator';

export enum Period {
  WEEK = 'week',
  MONTH = 'month',
  YEAR = 'year',
}

export class ChartQueryDto {
  @IsOptional()
  @IsEnum(Period)
  period?: Period;
}

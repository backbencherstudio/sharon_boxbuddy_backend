import {
  IsString,
  IsBoolean,
  IsArray,
  IsUUID,
  IsOptional,
  IsDateString,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateTravelDto {
  @IsOptional()
  @IsString()
  flight_number: string;

  @IsNotEmpty()
  @IsString()
  airline: string;

  @IsNotEmpty()
  @IsString()
  duration: string;

  @IsNotEmpty()
  @IsString()
  departure: string;

  @IsNotEmpty()
  @IsString()
  collect_radius: string;

  @IsNotEmpty()
  @IsString()
  arrival: string;

  @IsNotEmpty()
  @IsString()
  drop_radius: string;

  @IsNotEmpty()
  @IsArray()
  number_of_checked_bags: any[];

  @IsNotEmpty()
  @IsArray()
  number_of_cabin_bags: any[];

  @IsNotEmpty()
  @IsBoolean()
  accept_electronic_items: boolean;

  @IsNotEmpty()
  @IsString()
  trip_details: string;

  @IsOptional()
  @IsBoolean()
  publish: boolean;

  user_id: string;

  // new fields
  @IsNotEmpty()
  @IsString()
  departure_from: string;

  @IsNotEmpty()
  @IsString()
  arrival_to: string;
}

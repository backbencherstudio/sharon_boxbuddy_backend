import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreatePackageDto {
  @IsString()
  @IsNotEmpty()
  category: string;

  @IsString()
  @IsNotEmpty()
  weight: string;

  @IsString()
  @IsNotEmpty()
  value: string;

  @IsString()
  @IsOptional()
  length?: string;

  @IsString()
  @IsOptional()
  depth?: string;

  @IsString()
  @IsOptional()
  width?: string;

  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  is_electronic?: boolean;

  @IsString()
  @IsNotEmpty()
  pick_up_location: string;

  @IsString()
  @IsNotEmpty()
  pick_up_parson: string; // Assuming this is a string ID or name

  @IsString()
  @IsNotEmpty()
  drop_off_location: string;

  @IsString()
  @IsNotEmpty()
  drop_off_parson?: string; // Assuming this is a string ID or name

  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  publish?: boolean;

  @IsString()
  @IsOptional()
  @IsNotEmpty()
  owner_id: string;

  @IsString()
  @IsOptional()
  traveller_id?: string;

  photo?: string;
}

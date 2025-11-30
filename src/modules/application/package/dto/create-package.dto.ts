import { BadRequestException } from '@nestjs/common';
import { Transform } from 'class-transformer';
import {
  ArrayMinSize,
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsIn,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  ValidateIf,
} from 'class-validator';

export class CreatePackageDto {
  @Transform(({ value }) => {
    try {
      // If the value comes as a stringified JSON, parse it
      return typeof value === 'string' ? JSON.parse(value) : value;
    } catch {
      throw new BadRequestException(
        'Invalid format for category. category must be an array',
      );
    }
  })
  @IsArray({ message: 'category must be an array' })
  @ArrayNotEmpty({ message: 'category cannot be empty' })
  @ArrayMinSize(1, { message: 'category must have at least one item' })
  @IsString({ each: true, message: 'each category must be a string' })
  category: string[];

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
  // check valid value
  @IsIn(['Trusted Person', 'Self'], {
    message: 'pick_up_person must be either Trusted Person or Self',
  })
  pick_up_person: string;

  // // pick up person info
  // @IsOptional()
  // @IsString()
  // @Transform(({ value }) => JSON.parse(value))
  // pick_up_person_info: any;

  // @ValidateIf((o) => o.pick_up_person_info !== undefined)
  @ValidateIf((o) => o.pick_up_person === 'Trusted Person')
  @Transform(({ value }) => {
    try {
      // If value is already an object, return it directly
      if (typeof value === 'object') return value;
      // Otherwise try to parse it
      const pick_up_person_info = JSON.parse(value);
      // check if pick_up_person_info is not empty
      if (Object.keys(pick_up_person_info).length === 0) {
        throw new BadRequestException('pick_up_person_info cannot be empty');
      }
      return pick_up_person_info;
    } catch (e) {
      throw new BadRequestException(
        'Invalid JSON format for pick_up_person_info',
      );
    }
  })
  @IsObject({ message: 'pick_up_person_info must be a valid JSON object' })
  pick_up_person_info?: Record<string, any>;

  @IsString()
  @IsNotEmpty()
  drop_off_location: string;

  @IsNotEmpty()
  @IsString()
  // check valid value
  @IsIn(['Trusted Person', 'Self'], {
    message: 'drop_off_person must be either Trusted Person or Self',
  })
  drop_off_person: string;

  // pick up person info
  // @IsOptional()
  // @IsString()
  // @Transform(({ value }) => JSON.parse(value))
  // drop_person_info: any;

  @ValidateIf((o) => o.drop_off_person === 'Trusted Person')
  @Transform(({ value }) => {
    try {
      // If value is already an object, return it directly
      if (typeof value === 'object') return value;
      // Otherwise try to parse it
      const drop_off_person_info = JSON.parse(value);
      // check if drop_off_person_info is not empty
      if (Object.keys(drop_off_person_info).length === 0) {
        throw new BadRequestException('drop_off_person_info cannot be empty');
      }
      return drop_off_person_info;
    } catch (e) {
      throw new BadRequestException(
        'Invalid JSON format for drop_off_person_info',
      );
    }
  })
  @IsObject({ message: 'drop_off_person_info must be a valid JSON object' })
  drop_off_person_info?: Record<string, any>;

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

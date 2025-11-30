// src/stripe/dto/create-account.dto.ts
import { IsEmail, IsString, IsOptional, IsIn } from 'class-validator';

export class CreateConnectedAccountDto {
  @IsEmail()
  email: string;

  @IsString()
  @IsIn(['US', 'GB', 'CA', 'AU', 'DE', 'FR'])
  country: string;

  @IsString()
  @IsIn(['individual', 'company'])
  account_type: string;

  @IsString()
  display_name: string;

  @IsString()
  first_name: string;

  @IsString()
  last_name: string;

  @IsOptional()
  @IsString()
  phone?: string;
}

// src/stripe/dto/create-account-link.dto.ts
import { IsString, IsOptional } from 'class-validator';

export class CreateAccountLinkDto {
  @IsOptional()
  @IsString()
  return_url?: string;

  @IsOptional()
  @IsString()
  refresh_url?: string;
}

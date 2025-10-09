import { IsString, IsNotEmpty } from 'class-validator';

export class DropOffDto {
  @IsString()
  @IsNotEmpty()
  otp: string;
}
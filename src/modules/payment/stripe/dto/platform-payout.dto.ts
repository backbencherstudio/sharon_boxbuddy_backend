import { IsNotEmpty, IsNumber, IsString } from "class-validator";

export class PlatformPayoutDto {
    @IsNotEmpty()
    @IsNumber()
    amount: number;

    @IsNotEmpty()
    @IsString()
    currency: string;
}
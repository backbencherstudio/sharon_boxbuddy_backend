import { IsNotEmpty, IsNumber } from "class-validator";

export class PlatformPayoutDto {
    @IsNotEmpty()
    @IsNumber()
    amount: number;
}
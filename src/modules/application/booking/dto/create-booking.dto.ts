import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class CreateBookingDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'ID of the travel',
    example: '64f2e3f1e3f1e3f1e3f1e3f1',
  })
  travel_id: string; // ID of the package owner

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'ID of the package owner',
    example: '94f2e3f1e3f1e3f1e3f1e3e3',
  })
  package_id: string; // ID of the package being booked
}

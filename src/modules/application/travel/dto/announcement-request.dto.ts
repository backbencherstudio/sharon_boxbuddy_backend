import { IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AnnouncementRequestDto {
  @ApiProperty({
    description: 'Indicates if the announcement request is accepted',
    required: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  is_accepted?: boolean;

  @ApiProperty({
    description: 'Indicates if the announcement request is refused',
    required: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  is_refused?: boolean;
}

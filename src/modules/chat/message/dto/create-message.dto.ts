import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateMessageDto {

  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  conversation_id: string;

  @IsOptional()
  @IsString()
  @ApiProperty()
  message?: string;

  @IsOptional()
  @IsString({ each: true })
  @ApiProperty()
  attachments?: string[];

}

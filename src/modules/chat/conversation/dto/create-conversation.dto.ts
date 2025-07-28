import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsString } from 'class-validator';

export class CreateConversationDto {
  // @IsNotEmpty()
  // @IsString()
  // @ApiProperty({
  //   description: 'The id of the creator',
  // })
  creator_id: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'The id of the participant',
  })
  participant_id: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'The id of a package',
  })
  package_id: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'The id of a travel',
  })
  travel_id: string;

  @IsNotEmpty()
  @IsString()
  @IsIn(['traveller', 'package_owner'])  // Custom validation for allowed values
  @ApiProperty({
    description: 'Who created the conversation',
  })
  created_by: string;
}

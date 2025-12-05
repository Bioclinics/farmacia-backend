import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateBrandDto {
  @ApiProperty({ description: 'Nombre de la marca', maxLength: 100, example: 'Pfizer' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;
}

import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';

export class CreateCompositionDto {
  @ApiProperty({ description: 'Nombre del principio activo', maxLength: 255, example: 'Paracetamol' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiProperty({ description: 'Descripción del principio activo', required: false, example: 'Analgésico y antipirético' })
  @IsString()
  @IsOptional()
  description?: string;
}

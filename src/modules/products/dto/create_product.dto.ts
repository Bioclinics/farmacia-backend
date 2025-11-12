import { IsString, IsInt, IsNumber, IsOptional, IsBoolean, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProductDto {
  @ApiProperty({ description: 'Nombre del producto' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Id del tipo de producto' })
  @IsInt()
  idType: number;

  @ApiProperty({ description: 'Precio del producto', example: 0 })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiPropertyOptional({ description: 'Stock mínimo permitido', example: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  minStock?: number;

  @ApiPropertyOptional({ description: 'Stock actual', example: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  stock?: number;

  @ApiPropertyOptional({ description: 'Indica si el producto está activo', example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

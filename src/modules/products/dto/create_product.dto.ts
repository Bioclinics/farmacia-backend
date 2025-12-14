import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class CreateProductCompositionItemDto {
  @ApiProperty({ description: 'Id del principio activo', example: 1 })
  @Type(() => Number)
  @IsInt()
  idComposition: number;

  @ApiPropertyOptional({ description: 'Concentración del principio activo', example: '500 mg' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  concentration?: string;
}

export class CreateProductDto {
  @ApiProperty({ description: 'Nombre del producto' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Id del tipo de producto' })
  @IsInt()
  idType: number;

  @ApiProperty({ description: 'Id de la marca del producto' })
  @Type(() => Number)
  @IsInt()
  idBrand: number;

  @ApiProperty({ description: 'Id del laboratorio que fabrica el producto' })
  @Type(() => Number)
  @IsInt()
  idLaboratory: number;

  @ApiPropertyOptional({ description: 'Id del subtipo de producto (aplica si el tipo lo requiere)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  idSubtype?: number | null;

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

  @ApiPropertyOptional({
    description: 'Principios activos asociados al producto',
    type: [CreateProductCompositionItemDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateProductCompositionItemDto)
  compositions?: CreateProductCompositionItemDto[];
}

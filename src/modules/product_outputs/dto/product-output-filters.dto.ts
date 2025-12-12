import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsInt, IsOptional, Min } from 'class-validator';
import { Transform } from 'class-transformer';

const toOptionalNumber = ({ value }: { value: any }) => {
  if (value === undefined || value === null || value === '') return undefined;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? undefined : parsed;
};

export class ProductOutputFiltersDto {
  @ApiPropertyOptional({ description: 'Fecha inicial del rango', example: '2025-12-01' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Fecha final del rango', example: '2025-12-31' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Filtrar por producto', example: 12 })
  @IsOptional()
  @Transform(toOptionalNumber)
  @IsInt()
  @Min(1)
  productId?: number;

  @ApiPropertyOptional({ description: 'Filtrar por laboratorio o marca', example: 4 })
  @IsOptional()
  @Transform(toOptionalNumber)
  @IsInt()
  @Min(1)
  laboratoryId?: number;

  @ApiPropertyOptional({ description: 'Filtrar por responsable (usuario)', example: 3 })
  @IsOptional()
  @Transform(toOptionalNumber)
  @IsInt()
  @Min(1)
  userId?: number;

  @ApiPropertyOptional({ description: 'Filtrar por venta asociada', example: 45 })
  @IsOptional()
  @Transform(toOptionalNumber)
  @IsInt()
  @Min(1)
  saleId?: number;

  @ApiPropertyOptional({ description: 'Número de página', example: 1, default: 1 })
  @IsOptional()
  @Transform(toOptionalNumber)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ description: 'Tamaño de página', example: 25, default: 25 })
  @IsOptional()
  @Transform(toOptionalNumber)
  @IsInt()
  @Min(1)
  limit?: number;
}

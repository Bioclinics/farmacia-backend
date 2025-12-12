import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsDateString, IsInt, IsOptional, Min } from 'class-validator';

const toOptionalNumber = ({ value }: { value: any }) => {
  if (value === undefined || value === null || value === '') return undefined;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? undefined : parsed;
};

export class SalesReportFilterDto {
  @ApiPropertyOptional({ description: 'Fecha de referencia para el resumen diario y mensual', example: '2025-12-05' })
  @IsOptional()
  @IsDateString()
  targetDate?: string;

  @ApiPropertyOptional({ description: 'Fecha inicial del rango a consultar', example: '2025-12-01' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Fecha final del rango a consultar', example: '2025-12-31' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Identificador del usuario (staff) que registró la venta', example: 3 })
  @IsOptional()
  @Transform(toOptionalNumber)
  @IsInt()
  @Min(1)
  userId?: number;

  @ApiPropertyOptional({ description: 'Identificador del producto vendido', example: 12 })
  @IsOptional()
  @Transform(toOptionalNumber)
  @IsInt()
  @Min(1)
  productId?: number;

  @ApiPropertyOptional({ description: 'Identificador específico de la venta', example: 42 })
  @IsOptional()
  @Transform(toOptionalNumber)
  @IsInt()
  @Min(1)
  saleId?: number;

  @ApiPropertyOptional({ description: 'Número de página para la paginación', example: 1, default: 1 })
  @IsOptional()
  @Transform(toOptionalNumber)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ description: 'Cantidad de registros por página', example: 20, default: 20 })
  @IsOptional()
  @Transform(toOptionalNumber)
  @IsInt()
  @Min(1)
  limit?: number;
}

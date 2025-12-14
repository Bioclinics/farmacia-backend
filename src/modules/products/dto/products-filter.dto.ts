import { PaginationDto } from 'src/shared/dto/pagination.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, IsBoolean, IsArray } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class ProductsFilterDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Buscar por nombre (partial match)' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Id del tipo de producto para filtrar' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  type?: number;

  @ApiPropertyOptional({ description: 'Filtrar por productos activos (true/false)' })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Id de la marca para filtrar' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  brand?: number;

  @ApiPropertyOptional({ description: 'Id del laboratorio para filtrar' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  laboratory?: number;

  @ApiPropertyOptional({ description: 'Id del subtipo de producto para filtrar' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  subtype?: number;

  @ApiPropertyOptional({ description: 'IDs de principios activos separados por coma o repetidos en query', type: [Number] })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @Transform(({ value }) => {
    if (!value && value !== 0) return undefined;
    if (Array.isArray(value)) {
      return value
        .map((item) => Number(item))
        .filter((num) => Number.isFinite(num) && num > 0);
    }
    if (typeof value === 'string') {
      return value
        .split(',')
        .map((item) => Number(item.trim()))
        .filter((num) => Number.isFinite(num) && num > 0);
    }
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? [parsed] : undefined;
  })
  compositionIds?: number[];

  @ApiPropertyOptional({ description: 'Filtrar por productos combinados (más de un principio activo)' })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isCombined?: boolean;

  @ApiPropertyOptional({ description: 'Filtro por concentración del principio activo' })
  @IsOptional()
  @IsString()
  concentration?: string;
}

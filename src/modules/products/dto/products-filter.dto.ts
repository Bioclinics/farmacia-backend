import { PaginationDto } from 'src/shared/dto/pagination.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, IsBoolean } from 'class-validator';
import { Type, Transform } from 'class-transformer';

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
  @Transform(({ value }) => {
    if (value === undefined || value === null) return undefined;
    return value === 'true' || value === true;
  })
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Id de la marca para filtrar' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  brand?: number;
}

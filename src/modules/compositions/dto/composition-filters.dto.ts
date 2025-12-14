import { PaginationDto } from 'src/shared/dto/pagination.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CompositionFiltersDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Buscar por nombre del principio activo' })
  @IsOptional()
  @IsString()
  search?: string;
  
  @ApiPropertyOptional({ description: 'Elementos por página', default: 20, maximum: 200 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number = 20;
}

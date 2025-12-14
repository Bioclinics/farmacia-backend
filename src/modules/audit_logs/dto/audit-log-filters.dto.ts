import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsEnum, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { PaginationDto } from 'src/shared/dto/pagination.dto';
import { RolesEnum } from 'src/shared/enums/roles.enum';

export class AuditLogFiltersDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Fecha inicial (inclusive) en formato ISO', example: '2025-01-01' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Fecha final (inclusive) en formato ISO', example: '2025-01-31' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Filtrar por ID de usuario' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  userId?: number;

  @ApiPropertyOptional({ description: 'Filtrar por rol del usuario', enum: RolesEnum })
  @IsOptional()
  @Type(() => Number)
  @IsEnum(RolesEnum)
  roleId?: RolesEnum;

  @ApiPropertyOptional({ description: 'Filtrar por acción ejecutada' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  action?: string;

  @ApiPropertyOptional({ description: 'Filtrar por tabla o módulo afectado' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  tableName?: string;

  @ApiPropertyOptional({ description: 'Filtrar por ID del registro afectado' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  recordId?: number;
}

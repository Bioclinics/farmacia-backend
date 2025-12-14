import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min, IsObject } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateAuditLogDto {
  @ApiProperty({ description: 'Identificador del usuario que realiza la acción' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  idUser: number;

  @ApiProperty({ description: 'Acción realizada', example: 'CREATE' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  action: string;

  @ApiProperty({ description: 'Nombre de la tabla o módulo afectado', example: 'products' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  tableName: string;

  @ApiPropertyOptional({ description: 'Identificador del registro afectado' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  recordId?: number;

  @ApiPropertyOptional({ description: 'Descripción legible de la acción realizada' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Datos anteriores del registro afectados', type: Object })
  @IsOptional()
  @IsObject()
  oldData?: Record<string, unknown> | null;

  @ApiPropertyOptional({ description: 'Datos nuevos del registro afectados', type: Object })
  @IsOptional()
  @IsObject()
  newData?: Record<string, unknown> | null;

  @ApiPropertyOptional({ description: 'Dirección IP del cliente', example: '192.168.0.10' })
  @IsOptional()
  @IsString()
  @MaxLength(45)
  ipAddress?: string;
}

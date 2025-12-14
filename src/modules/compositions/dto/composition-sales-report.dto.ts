import { ApiPropertyOptional } from '@nestjs/swagger';

export class CompositionSalesReportDto {
  @ApiPropertyOptional({ description: 'IDs de principios activos a incluir', type: [Number] })
  compositionIds?: number[];

  @ApiPropertyOptional({ description: 'Fecha inicial (YYYY-MM-DD)' })
  startDate?: string;

  @ApiPropertyOptional({ description: 'Fecha final (YYYY-MM-DD)' })
  endDate?: string;

  @ApiPropertyOptional({ description: 'Incluir productos inactivos en el cálculo', default: false })
  includeInactiveProducts?: boolean;
}

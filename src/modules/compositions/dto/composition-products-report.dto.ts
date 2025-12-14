import { ApiPropertyOptional } from '@nestjs/swagger';

export class CompositionProductsReportDto {
  @ApiPropertyOptional({ description: 'IDs de principios activos a incluir', type: [Number] })
  compositionIds?: number[];

  @ApiPropertyOptional({ description: 'Incluir productos inactivos', default: false })
  includeInactiveProducts?: boolean;

  @ApiPropertyOptional({ description: 'IDs de laboratorios a incluir', type: [Number] })
  laboratoryIds?: number[];

  @ApiPropertyOptional({ description: 'IDs de tipos de producto a incluir', type: [Number] })
  productTypeIds?: number[];

  @ApiPropertyOptional({ description: 'IDs de subtipos de producto a incluir', type: [Number] })
  productSubtypeIds?: number[];
}

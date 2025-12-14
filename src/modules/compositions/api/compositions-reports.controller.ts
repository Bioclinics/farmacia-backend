import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { RolesGuard } from 'src/common/utils/roles.guard';
import { Roles } from 'src/common/utils/roles.decorator';
import { RolesEnum } from 'src/shared/enums/roles.enum';
import { CompositionsService } from '../services/compositions.service';
import { CompositionProductsReportDto } from '../dto/composition-products-report.dto';
import { CompositionSalesReportDto } from '../dto/composition-sales-report.dto';

@ApiTags('Compositions Reports')
@Controller('compositions/reports')
@UseGuards(RolesGuard)
export class CompositionsReportsController {
  constructor(private readonly compositionsService: CompositionsService) {}

  @Get('products')
  @Roles(RolesEnum.ADMIN, RolesEnum.STAFF)
  @ApiOperation({ summary: 'Reporte de productos por principio activo' })
  async products(@Query() query: Record<string, any>) {
    return this.compositionsService.getProductsReport(this.parseProductsReportFilters(query));
  }

  @Get('sales')
  @Roles(RolesEnum.ADMIN, RolesEnum.STAFF)
  @ApiOperation({ summary: 'Reporte de ventas por principio activo' })
  async sales(@Query() query: Record<string, any>) {
    return this.compositionsService.getSalesReport(this.parseSalesReportFilters(query));
  }

  @Get('combined-products')
  @Roles(RolesEnum.ADMIN, RolesEnum.STAFF)
  @ApiOperation({ summary: 'Reporte de productos combinados' })
  async combined(@Query() query: Record<string, any>) {
    return this.compositionsService.getCombinedProductsReport(this.parseProductsReportFilters(query));
  }

  private parseProductsReportFilters(query: Record<string, any>): CompositionProductsReportDto {
    return {
      compositionIds: this.parseIds(query?.compositionIds),
      includeInactiveProducts: this.parseBoolean(query?.includeInactiveProducts),
      laboratoryIds: this.parseIds(query?.laboratoryIds ?? query?.laboratoryId),
      productTypeIds: this.parseIds(query?.productTypeIds ?? query?.typeIds ?? query?.typeId),
      productSubtypeIds: this.parseIds(query?.productSubtypeIds ?? query?.subtypeIds ?? query?.subtypeId),
    };
  }

  private parseSalesReportFilters(query: Record<string, any>): CompositionSalesReportDto {
    return {
      compositionIds: this.parseIds(query?.compositionIds),
      includeInactiveProducts: this.parseBoolean(query?.includeInactiveProducts),
      startDate: this.parseDate(query?.startDate),
      endDate: this.parseDate(query?.endDate),
    };
  }

  private parseIds(raw: unknown): number[] | undefined {
    if (raw === undefined || raw === null || raw === '') {
      return undefined;
    }
    const values = Array.isArray(raw)
      ? raw
      : typeof raw === 'string'
      ? raw.split(',')
      : [raw];
    const parsed = values
      .map((value) => Number(value))
      .filter((value) => Number.isFinite(value) && value > 0);
    return parsed.length ? parsed : undefined;
  }

  private parseBoolean(raw: unknown): boolean | undefined {
    if (raw === undefined || raw === null || raw === '') {
      return undefined;
    }
    if (typeof raw === 'boolean') {
      return raw;
    }
    if (typeof raw === 'string') {
      const normalized = raw.trim().toLowerCase();
      if (normalized === 'true' || normalized === '1') {
        return true;
      }
      if (normalized === 'false' || normalized === '0') {
        return false;
      }
    }
    return undefined;
  }

  private parseDate(raw: unknown): string | undefined {
    if (typeof raw !== 'string' || !raw.trim()) {
      return undefined;
    }
    const parsed = new Date(raw);
    return Number.isNaN(parsed.getTime()) ? undefined : raw;
  }
}

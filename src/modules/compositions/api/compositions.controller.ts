import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { RolesGuard } from 'src/common/utils/roles.guard';
import { Roles } from 'src/common/utils/roles.decorator';
import { RolesEnum } from 'src/shared/enums/roles.enum';
import { CompositionsService } from '../services/compositions.service';
import { CreateCompositionDto } from '../dto/create-composition.dto';
import { UpdateCompositionDto } from '../dto/update-composition.dto';
import { AuditLogsService } from 'src/modules/audit_logs/services/audit_logs.service';
import { Request } from 'express';
import { CompositionFiltersDto } from '../dto/composition-filters.dto';
import { parsePagination, parseProductsReportFilters, parseSalesReportFilters } from '../utils/query-parsers';

@ApiTags('Compositions')
@Controller('compositions')
@UseGuards(RolesGuard)
export class CompositionsController {
  constructor(
    private readonly compositionsService: CompositionsService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  @Post()
  @Roles(RolesEnum.ADMIN)
  @ApiOperation({ summary: 'Crear un principio activo' })
  async create(@Body() dto: CreateCompositionDto, @Req() req: Request) {
    const composition = await this.compositionsService.createComposition(dto);
    const actorId = (req as any).user?.id;
    if (actorId) {
      await this.auditLogsService.record({
        actorId,
        action: 'Crear principio activo',
        tableName: 'compositions',
        recordId: composition.id_composition,
        description: `Creó el principio activo ${composition.name}`,
        newData: this.mapComposition(composition),
        request: req,
      });
    }
    return composition;
  }

  @Get()
  @Roles(RolesEnum.ADMIN, RolesEnum.STAFF)
  @ApiOperation({ summary: 'Listar principios activos' })
  @ApiQuery({ name: 'search', required: false, description: 'Buscar por nombre del principio activo' })
  @ApiQuery({ name: 'page', required: false, description: 'Página actual (1-based)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Elementos por página' })
  async findAll(@Query() query: Record<string, any>) {
    const pagination = parsePagination(query);
    const filters: CompositionFiltersDto = {
      search: pagination.search,
      page: pagination.page,
      limit: pagination.limit,
    };
    return this.compositionsService.findAll(filters);
  }

  @Get('reports/products')
  @Roles(RolesEnum.ADMIN, RolesEnum.STAFF)
  @ApiOperation({ summary: 'Reporte de productos por principio activo' })
  async getProductsReport(@Query() query: Record<string, any>) {
    const filters = parseProductsReportFilters(query);
    return this.compositionsService.getProductsReport(filters);
  }

  @Get('reports/sales')
  @Roles(RolesEnum.ADMIN, RolesEnum.STAFF)
  @ApiOperation({ summary: 'Reporte de ventas por principio activo' })
  async getSalesReport(@Query() query: Record<string, any>) {
    const filters = parseSalesReportFilters(query);
    return this.compositionsService.getSalesReport(filters);
  }

  @Get('reports/combined-products')
  @Roles(RolesEnum.ADMIN, RolesEnum.STAFF)
  @ApiOperation({ summary: 'Reporte de productos combinados' })
  async getCombinedProductsReport(@Query() query: Record<string, any>) {
    const filters = parseProductsReportFilters(query);
    return this.compositionsService.getCombinedProductsReport(filters);
  }

  @Put(':id')
  @Roles(RolesEnum.ADMIN)
  @ApiOperation({ summary: 'Actualizar un principio activo' })
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateCompositionDto, @Req() req: Request) {
    const before = await this.compositionsService.findOne(id);
    const updated = await this.compositionsService.updateComposition(id, dto);
    const actorId = (req as any).user?.id;
    if (actorId) {
      await this.auditLogsService.record({
        actorId,
        action: 'Editar principio activo',
        tableName: 'compositions',
        recordId: updated.id_composition,
        description: `Actualizó el principio activo ${updated.name}`,
        oldData: this.mapComposition(before),
        newData: this.mapComposition(updated),
        request: req,
      });
    }
    return updated;
  }

  @Delete(':id')
  @Roles(RolesEnum.ADMIN)
  @ApiOperation({ summary: 'Eliminar un principio activo' })
  async remove(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    const composition = await this.compositionsService.findOne(id);
    await this.compositionsService.deleteComposition(id);
    const actorId = (req as any).user?.id;
    if (actorId) {
      await this.auditLogsService.record({
        actorId,
        action: 'Eliminar principio activo',
        tableName: 'compositions',
        recordId: composition.id_composition,
        description: `Eliminó el principio activo ${composition.name}`,
        oldData: this.mapComposition(composition),
        request: req,
      });
    }
    return { deleted: true };
  }

  @Get('search/products')
  @Roles(RolesEnum.ADMIN, RolesEnum.STAFF)
  @ApiOperation({ summary: 'Buscar productos por nombre de principio activo' })
  @ApiQuery({ name: 'term', required: true, description: 'Nombre parcial del principio activo' })
  async searchProducts(@Query('term') term: string) {
    return this.compositionsService.searchProductsByCompositionName(term);
  }

  @Get(':id/products')
  @Roles(RolesEnum.ADMIN, RolesEnum.STAFF)
  @ApiOperation({ summary: 'Listar productos asociados a un principio activo' })
  async findProducts(@Param('id', ParseIntPipe) id: number) {
    return this.compositionsService.findProductsByComposition(id);
  }

  private mapComposition(composition: { id_composition: number; name: string; description?: string | null }) {
    return {
      id: composition.id_composition,
      name: composition.name,
      description: composition.description ?? null,
    };
  }
}

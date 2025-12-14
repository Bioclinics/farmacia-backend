import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Put, Req, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { RolesGuard } from 'src/common/utils/roles.guard';
import { Roles } from 'src/common/utils/roles.decorator';
import { RolesEnum } from 'src/shared/enums/roles.enum';
import { CompositionsService } from '../services/compositions.service';
import { AssignProductCompositionsDto, UpdateProductCompositionDto } from '../dto/product-composition.dto';
import { AuditLogsService } from 'src/modules/audit_logs/services/audit_logs.service';
import { Request } from 'express';

@ApiTags('Product Compositions')
@Controller('products/:productId/compositions')
@UseGuards(RolesGuard)
export class ProductCompositionsController {
  constructor(
    private readonly compositionsService: CompositionsService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  @Get()
  @Roles(RolesEnum.ADMIN, RolesEnum.STAFF)
  @ApiOperation({ summary: 'Listar principios activos asignados a un producto' })
  async list(@Param('productId', ParseIntPipe) productId: number) {
    return this.compositionsService.getProductCompositions(productId);
  }

  @Post()
  @Roles(RolesEnum.ADMIN)
  @ApiOperation({ summary: 'Asignar principios activos a un producto' })
  async assign(
    @Param('productId', ParseIntPipe) productId: number,
    @Body() dto: AssignProductCompositionsDto,
    @Req() req: Request,
  ) {
    const before = await this.compositionsService.getProductCompositions(productId);
    const after = await this.compositionsService.assignCompositions(productId, dto);
    await this.logAudit({
      req,
      productId,
      action: 'Asignar principios activos',
      oldData: { items: this.mapProductCompositionList(before) },
      newData: { items: this.mapProductCompositionList(after) },
      description: `Asignó principios activos al producto ${productId}`,
    });
    return after;
  }

  @Put()
  @Roles(RolesEnum.ADMIN)
  @ApiOperation({ summary: 'Reemplazar la lista de principios activos de un producto' })
  async replace(
    @Param('productId', ParseIntPipe) productId: number,
    @Body() dto: AssignProductCompositionsDto,
    @Req() req: Request,
  ) {
    const before = await this.compositionsService.getProductCompositions(productId);
    const after = await this.compositionsService.replaceProductCompositions(productId, dto);
    await this.logAudit({
      req,
      productId,
      action: 'Reemplazar principios activos',
      oldData: { items: this.mapProductCompositionList(before) },
      newData: { items: this.mapProductCompositionList(after) },
      description: `Actualizó los principios activos del producto ${productId}`,
    });
    return after;
  }

  @Patch(':compositionId')
  @Roles(RolesEnum.ADMIN)
  @ApiOperation({ summary: 'Actualizar la concentración de un principio activo asignado' })
  async updateConcentration(
    @Param('productId', ParseIntPipe) productId: number,
    @Param('compositionId', ParseIntPipe) compositionId: number,
    @Body() dto: UpdateProductCompositionDto,
    @Req() req: Request,
  ) {
    const before = await this.compositionsService.getProductComposition(productId, compositionId);
    const updated = await this.compositionsService.updateProductComposition(productId, compositionId, dto);
    await this.logAudit({
      req,
      productId,
      action: 'Actualizar concentración principio activo',
      oldData: this.mapProductComposition(before),
      newData: this.mapProductComposition(updated),
      description: `Actualizó concentración del principio activo ${compositionId} para el producto ${productId}`,
    });
    return updated;
  }

  @Delete(':compositionId')
  @Roles(RolesEnum.ADMIN)
  @ApiOperation({ summary: 'Eliminar un principio activo de un producto' })
  async remove(
    @Param('productId', ParseIntPipe) productId: number,
    @Param('compositionId', ParseIntPipe) compositionId: number,
    @Req() req: Request,
  ) {
    const removed = await this.compositionsService.removeProductComposition(productId, compositionId);
    await this.logAudit({
      req,
      productId,
      action: 'Eliminar principio activo de producto',
      oldData: this.mapProductComposition(removed),
      description: `Eliminó el principio activo ${compositionId} del producto ${productId}`,
    });
    return { deleted: true };
  }

  private async logAudit(config: {
    req: Request;
    productId: number;
    action: string;
    description: string;
    oldData?: Record<string, unknown>;
    newData?: Record<string, unknown>;
  }) {
    const actorId = (config.req as any).user?.id;
    if (!actorId) {
      return;
    }
    await this.auditLogsService.record({
      actorId,
      action: config.action,
      tableName: 'product_compositions',
      recordId: config.productId,
      description: config.description,
      oldData: config.oldData,
      newData: config.newData,
      request: config.req,
    });
  }

  private mapProductCompositionList(
    items: Array<{ id_product: number; id_composition: number; concentration: string; composition?: { id_composition: number; name: string } }>,
  ) {
    return items.map((item) => this.mapProductComposition(item));
  }

  private mapProductComposition(item: {
    id_product: number;
    id_composition: number;
    concentration: string;
    composition?: { id_composition: number; name: string };
  }) {
    return {
      productId: item.id_product,
      compositionId: item.id_composition,
      compositionName: item.composition?.name ?? null,
      concentration: item.concentration,
    };
  }
}

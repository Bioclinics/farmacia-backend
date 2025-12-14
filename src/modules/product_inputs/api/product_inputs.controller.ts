import { Controller, Get, Post, Body, Patch, Param, Delete, Res, Query, Req } from "@nestjs/common";
import { ProductInputsService } from "../services/product_inputs.service";
import { CreateProductInputDto } from '../dto/create_product_input.dto';
import { UpdateProductInputDto } from '../dto/update_product_input.dto';

import { Response } from "express";
import { OkRes, CreatedRes } from "src/common/utils";
import { ApiOperation } from "@nestjs/swagger";
import { ProductInputFiltersDto } from "../dto/product-input-filters.dto";
import { AuditLogsService } from "src/modules/audit_logs/services/audit_logs.service";
import { Request } from "express";

@Controller("product-inputs")
export class ProductInputsController {
  constructor(
    private readonly productInputsService: ProductInputsService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  private sanitizeInput(input: any): Record<string, unknown> {
    if (!input) return {};
    return {
      id: Number(input.id ?? input.id_input ?? 0),
      productId: Number(input.idProduct ?? input.id_product ?? 0),
      laboratoryId: input.idLaboratory ?? input.id_laboratory ?? null,
      quantityBoxes: Number(input.quantity ?? 0),
      unitsPerBox: Number(input.unitsPerBox ?? input.units_per_box ?? 0),
      unitCost: input.unitCost ?? input.unit_cost ?? null,
      subtotal: input.subtotal ?? null,
      isAdjustment: Boolean(input.isAdjustment ?? input.is_adjustment ?? false),
      reason: input.reason ?? null,
      createdAt: input.createdAt ?? input.created_at ?? null,
    };
  }

  @Post()
  @ApiOperation({ summary: "Crear ingreso de producto" })
  async create(@Body() dto: CreateProductInputDto, @Res() res: Response, @Req() req: Request) {
    const actorId = (req as any).user?.id;
    const input = await this.productInputsService.create(dto);
    if (actorId) {
      await this.auditLogsService.record({
        actorId,
        action: dto.isAdjustment ? 'Ajustes manuales de stock' : 'Registrar entrada',
        tableName: 'product_inputs',
        recordId: input.id,
        description: dto.isAdjustment ? `Ajuste de stock manual (${dto.reason ?? 'sin motivo'})` : `Registró entrada de producto #${input.idProduct}`,
        newData: this.sanitizeInput(input),
        request: req,
      });
    }
    return CreatedRes(res, { productInput: input });
  }

  @Get()
  @ApiOperation({ summary: "Listar ingresos de productos" })
  async findAll(@Query() filters: ProductInputFiltersDto, @Res() res: Response) {
    const response = await this.productInputsService.findAll(filters);
    return OkRes(res, response);
  }

  @Get(":id")
  @ApiOperation({ summary: "Obtener ingreso de producto por ID" })
  async findOne(@Param("id") id: string, @Res() res: Response) {
    const input = await this.productInputsService.findOne(+id);
    return OkRes(res, { productInput: input });
  }

  @Patch(":id")
  @ApiOperation({ summary: "Actualizar ingreso de producto" })
  async update(
    @Param("id") id: string,
    @Body() dto: UpdateProductInputDto,
    @Res() res: Response,
    @Req() req: Request,
  ) {
    const actorId = (req as any).user?.id;
    const before = await this.productInputsService.findOne(+id);
    const input = await this.productInputsService.update(+id, dto);
    if (actorId) {
      const action = dto.isAdjustment ?? before.isAdjustment ? 'Ajustes manuales de stock' : 'Editar entrada';
      await this.auditLogsService.record({
        actorId,
        action,
        tableName: 'product_inputs',
        recordId: input.id,
        description: `Actualizó el ingreso #${input.id}`,
        oldData: this.sanitizeInput(before),
        newData: this.sanitizeInput(input),
        request: req,
      });
    }
    return OkRes(res, { productInput: input });
  }

  @Delete(":id")
  @ApiOperation({ summary: "Eliminar ingreso de producto" })
  async remove(@Param("id") id: string, @Res() res: Response, @Req() req: Request) {
    const actorId = (req as any).user?.id;
    const existing = await this.productInputsService.findOne(+id);
    await this.productInputsService.remove(+id);
    if (actorId) {
      await this.auditLogsService.record({
        actorId,
        action: existing?.isAdjustment ? 'Eliminar ajuste' : 'Eliminar entrada',
        tableName: 'product_inputs',
        recordId: existing?.id ?? null,
        description: `Eliminó el ingreso #${existing?.id ?? id}`,
        oldData: this.sanitizeInput(existing),
        request: req,
      });
    }
    return OkRes(res, { deleted: true });
  }
}

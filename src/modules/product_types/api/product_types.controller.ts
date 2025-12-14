import { 
  Controller, Get, Post, Put, Patch, Delete, Param, Body, BadRequestException, UseGuards, Req
} from "@nestjs/common";
import { Roles } from "src/common/utils/roles.decorator";
import { RolesGuard } from "src/common/utils/roles.guard";
import { RolesEnum } from "src/shared/enums/roles.enum";
import { ProductTypesService } from "../services/product_types.service";
import { AuditLogsService } from "src/modules/audit_logs/services/audit_logs.service";
import { Request } from "express";
import { CreateProductTypeDto, UpdateProductTypeDto } from "../dto/create_product_type.dto";

@Controller("product-types")
@UseGuards(RolesGuard)
export class ProductTypesController {
  constructor(
    private readonly service: ProductTypesService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  // GET /product-types
  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(":id/subtypes")
  findSubtypes(@Param("id") id: string) {
    const parsedId = Number(id);
    if (isNaN(parsedId)) {
      throw new BadRequestException("ID inválido");
    }
    return this.service.findSubtypesByType(parsedId);
  }

  // GET /product-types/:id
  @Get(":id")
  findOne(@Param("id") id: string) {
    const parsedId = Number(id);
    if (isNaN(parsedId)) {
      throw new BadRequestException("ID inválido");
    }
    return this.service.findOne(parsedId);
  }

  // POST /product-types
  @Post()
  @Roles(RolesEnum.ADMIN)
  create(@Body() dto: CreateProductTypeDto, @Req() req: Request) {
    return this.service.create(dto).then(async (type) => {
      const actorId = (req as any).user?.id;
      if (actorId) {
        await this.auditLogsService.record({
          actorId,
          action: 'Crear tipo de producto',
          tableName: 'product_types',
          recordId: type.id_type ?? (type as any).id,
          description: `Creó el tipo ${type.name}`,
          newData: { id: type.id_type ?? (type as any).id, name: type.name },
          request: req,
        });
      }
      return type;
    });
  }

  // PUT /product-types/:id  -> reemplazo completo
  @Put(":id")
  @Roles(RolesEnum.ADMIN)
  update(@Param("id") id: string, @Body() dto: UpdateProductTypeDto, @Req() req: Request) {
    const parsedId = Number(id);
    if (isNaN(parsedId)) {
      throw new BadRequestException("ID inválido");
    }
    return this.service.findOne(parsedId).then(async (before) => {
      const updated = await this.service.update(parsedId, dto);
      const actorId = (req as any).user?.id;
      if (actorId) {
        await this.auditLogsService.record({
          actorId,
          action: 'Editar tipo de producto',
          tableName: 'product_types',
          recordId: updated.id_type ?? (updated as any).id,
          description: `Actualizó el tipo ${updated.name}`,
          oldData: { id: before.id_type ?? (before as any).id, name: before.name },
          newData: { id: updated.id_type ?? (updated as any).id, name: updated.name },
          request: req,
        });
      }
      return updated;
    });
  }

  // PATCH /product-types/:id -> actualización parcial
  @Patch(":id")
  @Roles(RolesEnum.ADMIN)
  partialUpdate(@Param("id") id: string, @Body() dto: UpdateProductTypeDto, @Req() req: Request) {
    const parsedId = Number(id);
    if (isNaN(parsedId)) {
      throw new BadRequestException("ID inválido");
    }
    return this.update(String(parsedId), dto, req);
  }

  // DELETE /product-types/:id
  @Delete(":id")
  @Roles(RolesEnum.ADMIN)
  remove(@Param("id") id: string, @Req() req: Request) {
    const parsedId = Number(id);
    if (isNaN(parsedId)) {
      throw new BadRequestException("ID inválido");
    }
    return this.service.findOne(parsedId).then(async (before) => {
      const result = await this.service.remove(parsedId);
      const actorId = (req as any).user?.id;
      if (actorId) {
        await this.auditLogsService.record({
          actorId,
          action: 'Eliminar tipo de producto',
          tableName: 'product_types',
          recordId: before.id_type ?? (before as any).id,
          description: `Eliminó el tipo ${before.name}`,
          oldData: { id: before.id_type ?? (before as any).id, name: before.name },
          request: req,
        });
      }
      return result;
    });
  }
}

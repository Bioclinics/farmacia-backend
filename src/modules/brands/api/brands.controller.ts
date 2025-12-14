import { Controller, Get, Post, Body, Param, Delete, Put, Query, UseGuards, ParseIntPipe, UsePipes, ValidationPipe, Req } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/common/utils/roles.decorator';
import { RolesGuard } from 'src/common/utils/roles.guard';
import { RolesEnum } from 'src/shared/enums/roles.enum';
import { BrandsService } from '../services/brands.service';
import { AuditLogsService } from 'src/modules/audit_logs/services/audit_logs.service';
import { Request } from 'express';
import { CreateBrandDto } from '../dto/create-brand.dto';
import { UpdateBrandDto } from '../dto/update-brand.dto';

@ApiTags('Brands')
@Controller('brands')
@UseGuards(RolesGuard)
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class BrandsController {
  constructor(
    private readonly brandsService: BrandsService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listado de marcas' })
  @ApiQuery({ name: 'search', required: false, description: 'Filtra por nombre de marca' })
  @ApiResponse({ status: 200, description: 'Listado de marcas' })
  findAll(@Query('search') search?: string) {
    return this.brandsService.findAll(search);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una marca por id' })
  @ApiParam({ name: 'id', description: 'ID de la marca' })
  @ApiResponse({ status: 200, description: 'Marca encontrada' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.brandsService.findOne(id);
  }

  @Post()
  @Roles(RolesEnum.ADMIN)
  @ApiOperation({ summary: 'Crear una nueva marca' })
  @ApiBody({ type: CreateBrandDto })
  @ApiResponse({ status: 201, description: 'Marca creada' })
  create(@Body() dto: CreateBrandDto, @Req() req: Request) {
    return this.brandsService.create(dto).then(async (brand) => {
      const actorId = (req as any).user?.id;
      if (actorId) {
        await this.auditLogsService.record({
          actorId,
          action: 'Crear marca',
          tableName: 'brands',
          recordId: brand.id_brand,
          description: `Creó la marca ${brand.name}`,
          newData: { id: brand.id_brand, name: brand.name },
          request: req,
        });
      }
      return brand;
    });
  }

  @Put(':id')
  @Roles(RolesEnum.ADMIN)
  @ApiOperation({ summary: 'Actualizar una marca' })
  @ApiParam({ name: 'id', description: 'ID de la marca' })
  @ApiBody({ type: UpdateBrandDto })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateBrandDto, @Req() req: Request) {
    return this.brandsService.findOne(id).then(async (before) => {
      const updated = await this.brandsService.update(id, dto);
      const actorId = (req as any).user?.id;
      if (actorId) {
        await this.auditLogsService.record({
          actorId,
          action: 'Editar marca',
          tableName: 'brands',
          recordId: updated.id_brand,
          description: `Actualizó la marca ${updated.name}`,
          oldData: { id: before.id_brand, name: before.name },
          newData: { id: updated.id_brand, name: updated.name },
          request: req,
        });
      }
      return updated;
    });
  }

  @Delete(':id')
  @Roles(RolesEnum.ADMIN)
  @ApiOperation({ summary: 'Eliminar una marca' })
  @ApiParam({ name: 'id', description: 'ID de la marca' })
  async remove(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    const before = await this.brandsService.findOne(id);
    await this.brandsService.remove(id);
    const actorId = (req as any).user?.id;
    if (actorId) {
      await this.auditLogsService.record({
        actorId,
        action: 'Eliminar marca',
        tableName: 'brands',
        recordId: before.id_brand,
        description: `Eliminó la marca ${before.name}`,
        oldData: { id: before.id_brand, name: before.name },
        request: req,
      });
    }
    return { deleted: true };
  }
}

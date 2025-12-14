import { Controller, Get, Query, Post, Body, Param, Put, Delete, ParseIntPipe, Patch, UsePipes, ValidationPipe, Req } from '@nestjs/common';
import { UseGuards } from '@nestjs/common';
import { Roles } from 'src/common/utils/roles.decorator';
import { RolesGuard } from 'src/common/utils/roles.guard';
import { RolesEnum } from 'src/shared/enums/roles.enum';
import { ProductsService } from '../services/products.service';
import { CreateProductDto } from '../dto/create_product.dto';
import { UpdateProductDto } from '../dto/update_product.dto';
import { ProductsFilterDto } from '../dto/products-filter.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam, ApiBody } from '@nestjs/swagger';
import { PaginatedProductsDto } from '../dto/paginated-products.dto';
import { AuditLogsService } from 'src/modules/audit_logs/services/audit_logs.service';
import { Request } from 'express';

@ApiTags('Products')
@Controller('products')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
@UseGuards(RolesGuard)
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  private sanitizeProduct(product: any): Record<string, unknown> {
    if (!product) return {};
    return {
      id: Number(product.id_product ?? product.id ?? product.idProduct ?? 0),
      name: product.name,
      price: Number(product.price ?? 0),
      stock: Number(product.stock ?? 0),
      minStock: Number(product.min_stock ?? product.minStock ?? 0),
      isActive: Boolean(product.is_active ?? product.isActive ?? false),
      isDeleted: Boolean(product.is_deleted ?? product.isDeleted ?? false),
      idType: Number(product.id_type ?? product.idType ?? 0),
      idBrand: Number(product.id_brand ?? product.idBrand ?? 0),
    };
  }

  private resolveProductChanges(previous: any, updated: any, dto: UpdateProductDto): string[] {
    const changes: string[] = [];
    if (typeof dto.name !== 'undefined' && dto.name !== previous.name) changes.push('name');
    if (typeof dto.price !== 'undefined' && Number(dto.price) !== Number(previous.price)) changes.push('price');
    if (typeof dto.stock !== 'undefined' && Number(dto.stock) !== Number(previous.stock)) changes.push('stock');
    if (typeof dto.minStock !== 'undefined' && Number(dto.minStock) !== Number(previous.min_stock)) changes.push('minStock');
    if (typeof dto.idBrand !== 'undefined' && dto.idBrand !== previous.id_brand) changes.push('brand');
    if (typeof dto.idType !== 'undefined' && dto.idType !== previous.id_type) changes.push('type');
    if (typeof dto.isActive !== 'undefined' && Boolean(dto.isActive) !== Boolean(previous.is_active)) changes.push('status');
    return changes;
  }

  private resolveProductUpdateAction(changes: string[]): string {
    if (!changes.length) return 'Editar producto';
    if (changes.length === 1) {
      if (changes[0] === 'price') return 'Cambiar precio';
      if (changes[0] === 'stock' || changes[0] === 'minStock') return 'Cambiar stock manual';
    }
    if (changes.includes('price') && !changes.some((c) => c !== 'price')) return 'Cambiar precio';
    if (changes.includes('stock') && !changes.some((c) => c !== 'stock' && c !== 'minStock')) return 'Cambiar stock manual';
    return 'Editar producto';
  }

  @Get()
  @ApiOperation({ summary: 'Obtener productos con paginación y filtros' })
  @ApiQuery({ name: 'page', required: false, description: 'Número de página (1-based)', example: 1 })
  @ApiQuery({ name: 'limit', required: false, description: 'Ítems por página', example: 10 })
  @ApiQuery({ name: 'name', required: false, description: 'Filtro por nombre (partial)' })
  @ApiQuery({ name: 'type', required: false, description: 'Filtro por id del tipo de producto' })
  @ApiQuery({ name: 'isActive', required: false, description: 'Filtrar por productos activos (true/false)' })
  @ApiQuery({ name: 'brand', required: false, description: 'Filtro por id de marca' })
  @ApiResponse({ status: 200, description: 'Lista paginada de productos', type: PaginatedProductsDto })
  findAll(@Query() query: ProductsFilterDto) {
    return this.productsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un producto por id' })
  @ApiParam({ name: 'id', description: 'Id del producto' })
  @ApiResponse({ status: 200, description: 'Producto encontrado' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Crear un producto' })
  @ApiBody({ type: CreateProductDto })
  @Roles(RolesEnum.ADMIN)
  async create(@Body() dto: CreateProductDto, @Req() req: Request) {
    const actorId = (req as any).user?.id;
    const product = await this.productsService.create(dto);
    if (actorId) {
      await this.auditLogsService.record({
        actorId,
        action: 'Crear producto',
        tableName: 'products',
        recordId: product.id_product,
        description: `Creó el producto ${product.name}`,
        newData: this.sanitizeProduct(product),
        request: req,
      });
    }
    return product;
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar un producto' })
  @ApiParam({ name: 'id', description: 'Id del producto' })
  @ApiBody({ type: UpdateProductDto })
  @Roles(RolesEnum.ADMIN)
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateProductDto, @Req() req: Request) {
    const actorId = (req as any).user?.id;
    const previous = await this.productsService.findOne(id);
    const product = await this.productsService.update(id, dto);
    if (actorId) {
      const changes = this.resolveProductChanges(previous, product, dto);
      const action = this.resolveProductUpdateAction(changes);
      await this.auditLogsService.record({
        actorId,
        action,
        tableName: 'products',
        recordId: product.id_product,
        description: `Actualizó el producto ${product.name}`,
        oldData: this.sanitizeProduct(previous),
        newData: this.sanitizeProduct(product),
        request: req,
      });
    }
    return product;
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar (soft) un producto' })
  @ApiParam({ name: 'id', description: 'Id del producto' })
  @Roles(RolesEnum.ADMIN)
  async remove(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    const actorId = (req as any).user?.id;
    const existing = await this.productsService.findOne(id);
    const result = await this.productsService.remove(id);
    if (actorId) {
      await this.auditLogsService.record({
        actorId,
        action: 'Eliminar producto',
        tableName: 'products',
        recordId: existing.id_product,
        description: `Eliminó (soft) el producto ${existing.name}`,
        oldData: this.sanitizeProduct(existing),
        newData: { ...this.sanitizeProduct(existing), isDeleted: true },
        request: req,
      });
    }
    return result;
  }

  @Patch(':id/activate')
  @ApiOperation({ summary: 'Activar un producto' })
  @ApiParam({ name: 'id', description: 'Id del producto' })
  @Roles(RolesEnum.ADMIN)
  async activate(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    const actorId = (req as any).user?.id;
    const previous = await this.productsService.findOne(id);
    const product = await this.productsService.setActive(id, true);
    if (actorId) {
      await this.auditLogsService.record({
        actorId,
        action: 'Activar producto',
        tableName: 'products',
        recordId: product.id_product,
        description: `Activó el producto ${product.name}`,
        oldData: this.sanitizeProduct(previous),
        newData: this.sanitizeProduct(product),
        request: req,
      });
    }
    return product;
  }

  @Patch(':id/deactivate')
  @ApiOperation({ summary: 'Desactivar un producto' })
  @ApiParam({ name: 'id', description: 'Id del producto' })
  @Roles(RolesEnum.ADMIN)
  async deactivate(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    const actorId = (req as any).user?.id;
    const previous = await this.productsService.findOne(id);
    const product = await this.productsService.setActive(id, false);
    if (actorId) {
      await this.auditLogsService.record({
        actorId,
        action: 'Desactivar producto',
        tableName: 'products',
        recordId: product.id_product,
        description: `Desactivó el producto ${product.name}`,
        oldData: this.sanitizeProduct(previous),
        newData: this.sanitizeProduct(product),
        request: req,
      });
    }
    return product;
  }
}

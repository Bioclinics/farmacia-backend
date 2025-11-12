import { Controller, Get, Query, Post, Body, Param, Put, Delete, ParseIntPipe, Patch, UsePipes, ValidationPipe } from '@nestjs/common';
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

@ApiTags('Products')
@Controller('products')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
@UseGuards(RolesGuard)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @ApiOperation({ summary: 'Obtener productos con paginación y filtros' })
  @ApiQuery({ name: 'page', required: false, description: 'Número de página (1-based)', example: 1 })
  @ApiQuery({ name: 'limit', required: false, description: 'Ítems por página', example: 10 })
  @ApiQuery({ name: 'name', required: false, description: 'Filtro por nombre (partial)' })
  @ApiQuery({ name: 'type', required: false, description: 'Filtro por id del tipo de producto' })
  @ApiQuery({ name: 'isActive', required: false, description: 'Filtrar por productos activos (true/false)' })
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
  create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar un producto' })
  @ApiParam({ name: 'id', description: 'Id del producto' })
  @ApiBody({ type: UpdateProductDto })
  @Roles(RolesEnum.ADMIN)
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateProductDto) {
    return this.productsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar (soft) un producto' })
  @ApiParam({ name: 'id', description: 'Id del producto' })
  @Roles(RolesEnum.ADMIN)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.remove(id);
  }

  @Patch(':id/activate')
  @ApiOperation({ summary: 'Activar un producto' })
  @ApiParam({ name: 'id', description: 'Id del producto' })
  @Roles(RolesEnum.ADMIN)
  activate(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.setActive(id, true);
  }

  @Patch(':id/deactivate')
  @ApiOperation({ summary: 'Desactivar un producto' })
  @ApiParam({ name: 'id', description: 'Id del producto' })
  @Roles(RolesEnum.ADMIN)
  deactivate(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.setActive(id, false);
  }
}

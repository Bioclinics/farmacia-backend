import { Controller, Get, Post, Body, Param, Patch, Delete, Query, BadRequestException } from '@nestjs/common';
import { UseGuards } from '@nestjs/common';
import { Roles } from 'src/common/utils/roles.decorator';
import { RolesGuard } from 'src/common/utils/roles.guard';
import { RolesEnum } from 'src/shared/enums/roles.enum';
import { ProductOutputsService } from '../services/product_outputs.service';
import { CreateProductOutputDto } from '../dto/create_product_output.dto';
import { UpdateProductOutputDto } from '../dto/update_product_output.dto';

class CreateAdjustmentDto {
  id_product!: number;
  quantity!: number;
  unit_price!: number;
  reason!: string;
}

@Controller('product-outputs')
export class ProductOutputsController {
  constructor(private readonly productOutputsService: ProductOutputsService) {}

  @Get()
  findAll(
    @Query('saleId') saleId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('productId') productId?: string,
    @Query('laboratoryId') laboratoryId?: string,
    @Query('userId') userId?: string,
  ) {
    if (saleId) return this.productOutputsService.findBySale(Number(saleId))
    return this.productOutputsService.findAllWithFilters({
      startDate,
      endDate,
      productId: productId ? Number(productId) : undefined,
      laboratoryId: laboratoryId ? Number(laboratoryId) : undefined,
      userId: userId ? Number(userId) : undefined,
    });
  }

  @Post()
  create(@Body() dto: CreateProductOutputDto) {
    return this.productOutputsService.create(dto);
  }

  @Post('adjustment')
  @UseGuards(RolesGuard)
  @Roles(RolesEnum.ADMIN, RolesEnum.STAFF)
  async createAdjustment(@Body() dto: CreateAdjustmentDto) {
    // validate required fields
    if (!dto || typeof dto.id_product === 'undefined' || typeof dto.quantity === 'undefined' || typeof dto.unit_price === 'undefined') {
      throw new BadRequestException('id_product, quantity and unit_price are required')
    }
    if (!dto.reason || dto.reason.trim() === '') {
      throw new BadRequestException('reason is required for adjustments')
    }

    const toCreate: CreateProductOutputDto = {
      id_product: dto.id_product,
      quantity: dto.quantity,
      unit_price: dto.unit_price,
      subtotal: Number(dto.unit_price) * Number(dto.quantity),
      is_adjustment: true,
      reason: dto.reason,
    }

    return this.productOutputsService.create(toCreate);
  }

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.productOutputsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: number, @Body() dto: UpdateProductOutputDto) {
    return this.productOutputsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: number) {
    return this.productOutputsService.remove(id);
  }
}

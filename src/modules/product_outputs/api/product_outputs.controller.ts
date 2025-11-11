import { Controller, Get, Post, Body, Param, Patch, Delete } from '@nestjs/common';
import { ProductOutputsService } from '../services/product_outputs.service';
import { CreateProductOutputDto } from '../dto/create_product_output.dto';
import { UpdateProductOutputDto } from '../dto/update_product_output.dto';

@Controller('product-outputs')
export class ProductOutputsController {
  constructor(private readonly productOutputsService: ProductOutputsService) {}

  @Get()
  findAll() {
    return this.productOutputsService.findAll();
  }

  @Post()
  create(@Body() dto: CreateProductOutputDto) {
    return this.productOutputsService.create(dto);
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

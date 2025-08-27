import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ProductOutputsService } from './product_outputs.service';
import { CreateProductOutputDto } from './dto/create-product_output.dto';
import { UpdateProductOutputDto } from './dto/update-product_output.dto';

@Controller('product-outputs')
export class ProductOutputsController {
  constructor(private readonly productOutputsService: ProductOutputsService) {}

  @Post()
  create(@Body() createProductOutputDto: CreateProductOutputDto) {
    return this.productOutputsService.create(createProductOutputDto);
  }

  @Get()
  findAll() {
    return this.productOutputsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productOutputsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateProductOutputDto: UpdateProductOutputDto) {
    return this.productOutputsService.update(+id, updateProductOutputDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productOutputsService.remove(+id);
  }
}

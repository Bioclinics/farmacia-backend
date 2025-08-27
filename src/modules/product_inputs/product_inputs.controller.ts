import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ProductInputsService } from './product_inputs.service';
import { CreateProductInputDto } from './dto/create-product_input.dto';
import { UpdateProductInputDto } from './dto/update-product_input.dto';

@Controller('product-inputs')
export class ProductInputsController {
  constructor(private readonly productInputsService: ProductInputsService) {}

  @Post()
  create(@Body() createProductInputDto: CreateProductInputDto) {
    return this.productInputsService.create(createProductInputDto);
  }

  @Get()
  findAll() {
    return this.productInputsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productInputsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateProductInputDto: UpdateProductInputDto) {
    return this.productInputsService.update(+id, updateProductInputDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productInputsService.remove(+id);
  }
}

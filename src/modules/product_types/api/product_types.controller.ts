import { Controller, Get, Post, Put, Delete, Param, Body } from "@nestjs/common";
import { ProductTypesService } from "../services/product_types.service";
import { CreateProductTypeDto } from "../dto/create_product_type.dto";

@Controller("product-types")
export class ProductTypesController {
  constructor(private readonly service: ProductTypesService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.service.findOne(+id);
  }

  @Post()
  create(@Body() dto: CreateProductTypeDto) {
    return this.service.create(dto);
  }

  @Put(":id")
  update(@Param("id") id: string, @Body() dto: CreateProductTypeDto) {
    return this.service.update(+id, dto);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.service.remove(+id);
  }
}

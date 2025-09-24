// products.controller.ts
import { Controller, Get, Post, Body, Delete, Param, Put } from "@nestjs/common";
import { ProductsService } from "../services/products.service"; // subir un nivel
import { CreateProductDto } from "../dto/create_product.dto"; // subir un nivel
import { UpdateProductDto } from "../dto/update_product.dto"; // subir un nivel

@Controller("products")
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  findAll() {
    return this.productsService.findAll();
  }

  @Get(":id")
  findOne(@Param("id") id: number) {
    return this.productsService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  @Put(":id")
  update(@Param("id") id: number, @Body() dto: UpdateProductDto) {
    return this.productsService.update(id, dto);
  }

  @Delete(":id")
  remove(@Param("id") id: number) {
    return this.productsService.remove(id);
  }
}

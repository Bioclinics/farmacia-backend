import { 
  Controller, Get, Post, Put, Patch, Delete, Param, Body, BadRequestException 
} from "@nestjs/common";
import { ProductTypesService } from "../services/product_types.service";
import { CreateProductTypeDto, UpdateProductTypeDto } from "../dto/create_product_type.dto";

@Controller("product-types")
export class ProductTypesController {
  constructor(private readonly service: ProductTypesService) {}

  // GET /product-types
  @Get()
  findAll() {
    return this.service.findAll();
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
  create(@Body() dto: CreateProductTypeDto) {
    return this.service.create(dto);
  }

  // PUT /product-types/:id  -> reemplazo completo
  @Put(":id")
  update(@Param("id") id: string, @Body() dto: UpdateProductTypeDto) {
    const parsedId = Number(id);
    if (isNaN(parsedId)) {
      throw new BadRequestException("ID inválido");
    }
    return this.service.update(parsedId, dto);
  }

  // PATCH /product-types/:id -> actualización parcial
  @Patch(":id")
  partialUpdate(@Param("id") id: string, @Body() dto: UpdateProductTypeDto) {
    const parsedId = Number(id);
    if (isNaN(parsedId)) {
      throw new BadRequestException("ID inválido");
    }
    return this.service.update(parsedId, dto);
  }

  // DELETE /product-types/:id
  @Delete(":id")
  remove(@Param("id") id: string) {
    const parsedId = Number(id);
    if (isNaN(parsedId)) {
      throw new BadRequestException("ID inválido");
    }
    return this.service.remove(parsedId);
  }
}

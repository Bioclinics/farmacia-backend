import { 
  Controller, Get, Post, Put, Patch, Delete, Param, Body, BadRequestException, UseGuards
} from "@nestjs/common";
import { Roles } from "src/common/utils/roles.decorator";
import { RolesGuard } from "src/common/utils/roles.guard";
import { RolesEnum } from "src/shared/enums/roles.enum";
import { ProductTypesService } from "../services/product_types.service";
import { CreateProductTypeDto, UpdateProductTypeDto } from "../dto/create_product_type.dto";

@Controller("product-types")
@UseGuards(RolesGuard)
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
  @Roles(RolesEnum.ADMIN)
  create(@Body() dto: CreateProductTypeDto) {
    return this.service.create(dto);
  }

  // PUT /product-types/:id  -> reemplazo completo
  @Put(":id")
  @Roles(RolesEnum.ADMIN)
  update(@Param("id") id: string, @Body() dto: UpdateProductTypeDto) {
    const parsedId = Number(id);
    if (isNaN(parsedId)) {
      throw new BadRequestException("ID inválido");
    }
    return this.service.update(parsedId, dto);
  }

  // PATCH /product-types/:id -> actualización parcial
  @Patch(":id")
  @Roles(RolesEnum.ADMIN)
  partialUpdate(@Param("id") id: string, @Body() dto: UpdateProductTypeDto) {
    const parsedId = Number(id);
    if (isNaN(parsedId)) {
      throw new BadRequestException("ID inválido");
    }
    return this.service.update(parsedId, dto);
  }

  // DELETE /product-types/:id
  @Delete(":id")
  @Roles(RolesEnum.ADMIN)
  remove(@Param("id") id: string) {
    const parsedId = Number(id);
    if (isNaN(parsedId)) {
      throw new BadRequestException("ID inválido");
    }
    return this.service.remove(parsedId);
  }
}

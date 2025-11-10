import { Controller, Get, Post, Patch, Delete, Param, Body, Res } from "@nestjs/common";
import { ProductOutputsService } from "../services/product_outputs.service";
import { CreateProductOutputDto } from "../dto/create_product_output.dto";
import { UpdateProductOutputDto } from "../dto/update_product_output.dto";
import { Response } from "express";
import { OkRes, CreatedRes } from "src/common/utils";
import { ApiOperation } from "@nestjs/swagger";

@Controller("product-outputs")
export class ProductOutputsController {
  constructor(private readonly service: ProductOutputsService) {}

  @Post()
  @ApiOperation({ summary: "Crear salida de producto" })
  async create(@Body() dto: CreateProductOutputDto, @Res() res: Response) {
    const output = await this.service.create(dto);
    return CreatedRes(res, { productOutput: output });
  }

  @Get()
  @ApiOperation({ summary: "Listar salidas de productos" })
  async findAll(@Res() res: Response) {
    const outputs = await this.service.findAll();
    return OkRes(res, { productOutputs: outputs });
  }

  @Get(":id")
  @ApiOperation({ summary: "Obtener salida por ID" })
  async findOne(@Param("id") id: string, @Res() res: Response) {
    const output = await this.service.findOne(+id);
    return OkRes(res, { productOutput: output });
  }

  @Patch(":id")
  @ApiOperation({ summary: "Actualizar salida de producto" })
  async update(@Param("id") id: string, @Body() dto: UpdateProductOutputDto, @Res() res: Response) {
    const output = await this.service.update(+id, dto);
    return OkRes(res, { productOutput: output });
  }

  @Delete(":id")
  @ApiOperation({ summary: "Eliminar salida de producto" })
  async remove(@Param("id") id: string, @Res() res: Response) {
    await this.service.remove(+id);
    return OkRes(res, { deleted: true });
  }
}

import { Controller, Get, Post, Body, Patch, Param, Delete, Res } from "@nestjs/common";
import { ProductInputsService } from "../services/product_inputs.service";
import { CreateProductInputDto } from '../dto/create_product_input.dto';
import { UpdateProductInputDto } from '../dto/update_product_input.dto';

import { Response } from "express";
import { OkRes, CreatedRes } from "src/common/utils";
import { ApiOperation } from "@nestjs/swagger";

@Controller("product-inputs")
export class ProductInputsController {
  constructor(private readonly productInputsService: ProductInputsService) {}

  @Post()
  @ApiOperation({ summary: "Crear ingreso de producto" })
  async create(@Body() dto: CreateProductInputDto, @Res() res: Response) {
    const input = await this.productInputsService.create(dto);
    return CreatedRes(res, { productInput: input });
  }

  @Get()
  @ApiOperation({ summary: "Listar ingresos de productos" })
  async findAll(@Res() res: Response) {
    const inputs = await this.productInputsService.findAll();
    return OkRes(res, { productInputs: inputs });
  }

  @Get(":id")
  @ApiOperation({ summary: "Obtener ingreso de producto por ID" })
  async findOne(@Param("id") id: string, @Res() res: Response) {
    const input = await this.productInputsService.findOne(+id);
    return OkRes(res, { productInput: input });
  }

  @Patch(":id")
  @ApiOperation({ summary: "Actualizar ingreso de producto" })
  async update(
    @Param("id") id: string,
    @Body() dto: UpdateProductInputDto,
    @Res() res: Response
  ) {
    const input = await this.productInputsService.update(+id, dto);
    return OkRes(res, { productInput: input });
  }

  @Delete(":id")
  @ApiOperation({ summary: "Eliminar ingreso de producto" })
  async remove(@Param("id") id: string, @Res() res: Response) {
    await this.productInputsService.remove(+id);
    return OkRes(res, { deleted: true });
  }
}

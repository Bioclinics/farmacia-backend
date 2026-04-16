import { Controller, Get, Post, Body, Patch, Param, Delete, Res, Query } from "@nestjs/common";
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
  @ApiOperation({ summary: "Listar ingresos de productos con filtros opcionales" })
  async findAll(
    @Res() res: Response,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('productId') productId?: string,
    @Query('laboratoryId') laboratoryId?: string,
    @Query('isAdjustment') isAdjustment?: string,
  ) {
    const filters: any = {};
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;
    if (productId) filters.productId = Number(productId);
    if (laboratoryId) filters.laboratoryId = Number(laboratoryId);
    if (typeof isAdjustment !== 'undefined') filters.isAdjustment = isAdjustment === 'true';

    const result = await this.productInputsService.findAll(filters);
    return OkRes(res, result);
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

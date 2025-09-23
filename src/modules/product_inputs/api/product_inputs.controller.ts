import { Controller, Get, Res } from "@nestjs/common";
import { ProductInputsService } from "../services/product_inputs.service";
import { Response } from "express";
import { OkRes } from "src/common/utils";
import { ApiOperation } from "@nestjs/swagger";

@Controller("product-inputs")
export class ProductInputsController {
    constructor(private readonly productInputsService: ProductInputsService) {}

    @Get()
    @ApiOperation({
        summary: "Api para obtener los ingresos de productos"
    })
    async findAll(@Res() res: Response) {
        const productInputs = await this.productInputsService.findAll();
        return OkRes(res, {
            productInputs: productInputs
        });
    }
}

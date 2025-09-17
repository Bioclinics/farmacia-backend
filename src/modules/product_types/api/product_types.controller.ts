import { Controller, Get, Res } from '@nestjs/common';
import { ProductTypesService } from '../services/product_types.service';
import { Response } from 'express';
import { OkRes } from 'src/common/utils';
import { ApiOperation } from '@nestjs/swagger';

@Controller('product-types')
export class ProductTypesController {
    constructor(private readonly productTypesService: ProductTypesService) {}

    @Get()
    @ApiOperation({
        summary: 'Api para obtener los tipos de producto'
    })
    async findAll(@Res() res: Response) {
        const productTypes = await this.productTypesService.findAll();
        return OkRes(res, {
            productTypes: productTypes
        });
    }
}

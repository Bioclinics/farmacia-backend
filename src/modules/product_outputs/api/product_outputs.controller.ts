import { Controller, Get } from "@nestjs/common";
import { ProductOutputsService } from "../services/product_outputs.service";
import { ProductOutput } from "../entities/product_output.entity";

@Controller("product-outputs")
export class ProductOutputsController {
    constructor(private readonly productOutputsService: ProductOutputsService) {}

    @Get()
    async findAll(): Promise<ProductOutput[]> {
        return await this.productOutputsService.findAll();
    }
}

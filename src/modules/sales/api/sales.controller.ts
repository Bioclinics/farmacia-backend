import { Controller, Get } from "@nestjs/common";
import { SalesService } from "../services/sales.service";
import { Sale } from "../entities/sale.entity";

@Controller("sales")
export class SalesController {
    constructor(private readonly salesService: SalesService) {}

    @Get()
    async findAll(): Promise<Sale[]> {
        return await this.salesService.findAll();
    }
}

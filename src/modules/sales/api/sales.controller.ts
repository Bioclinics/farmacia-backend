import { Controller, Get, Post, Body, Inject } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { DataSource } from "typeorm";
import { SalesService } from "../services/sales.service";
import { ProductOutputsService } from "src/modules/product_outputs/services/product_outputs.service";
import { Sale } from "../entities/sale.entity";

@ApiTags('Sales')
@Controller("sales")
export class SalesController {
    constructor(
        private readonly salesService: SalesService,
        private readonly productOutputsService: ProductOutputsService,
        private readonly dataSource: DataSource,
    ) {}

    @Get()
    @ApiOperation({ summary: 'Obtener todas las ventas' })
    @ApiResponse({ status: 200, description: 'Lista de ventas', type: [Sale] })
    async findAll(): Promise<Sale[]> {
        return await this.salesService.findAll();
    }

    @Post()
    @ApiOperation({ summary: 'Crear una nueva venta con productos (outputs)' })
    @ApiResponse({ status: 201, description: 'Venta creada con outputs', type: Sale })
    async create(@Body() payload: { idUser: number; total: number; notes?: string; items?: any[] }): Promise<any> {
        // Use transaction to ensure consistency
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
                console.log('[SalesController] Received payload for create:', JSON.stringify(payload, null, 2))
            // Create sale
            const sale = await this.salesService.create({
                idUser: payload.idUser,
                total: payload.total,
                notes: payload.notes,
            }, queryRunner.manager);

            // Create product outputs if provided
            if (payload.items && Array.isArray(payload.items) && payload.items.length > 0) {
                console.log('[SalesController] Creating outputs for sale id:', sale.id, 'items:', payload.items)
                const outputs = await this.productOutputsService.createManyForSale(
                    sale.id,
                    payload.items,
                    queryRunner.manager
                );
                console.log('[SalesController] Outputs created:', outputs)
                await queryRunner.commitTransaction();
                return { sale, outputs };
            }

            await queryRunner.commitTransaction();
            return { sale };
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }
}

import { Controller, Get, Post, Body, Query, Req } from "@nestjs/common";
import { UseGuards } from '@nestjs/common';
import { Roles } from 'src/common/utils/roles.decorator';
import { RolesGuard } from 'src/common/utils/roles.guard';
import { RolesEnum } from 'src/shared/enums/roles.enum';
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { DataSource } from "typeorm";
import { SalesService } from "../services/sales.service";
import { ProductOutputsService } from "src/modules/product_outputs/services/product_outputs.service";
import { Sale } from "../entities/sale.entity";
import { SalesReportFilterDto } from "../dto/sales-report-filter.dto";
import { AuditLogsService } from "src/modules/audit_logs/services/audit_logs.service";
import { Request } from "express";

@ApiTags('Sales')
@Controller("sales")
@UseGuards(RolesGuard)
export class SalesController {
    constructor(
        private readonly salesService: SalesService,
        private readonly productOutputsService: ProductOutputsService,
        private readonly dataSource: DataSource,
        private readonly auditLogsService: AuditLogsService,
    ) {}

    private buildSaleLogPayload(sale: Sale, items?: any[]) {
        return {
            id: Number(sale.id),
            total: Number(sale.total),
            notes: sale.notes ?? null,
            idUser: sale.idUser ?? (sale as any).id_user ?? null,
            createdAt: sale.created_at ?? (sale as any)?.createdAt ?? new Date(),
            items: Array.isArray(items)
                ? items.map((item) => ({
                    productId: item.idProduct ?? item.id_product,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice ?? item.unit_price,
                    subtotal: item.subtotal,
                  }))
                : undefined,
        };
    }

    @Get()
    @Roles(RolesEnum.STAFF, RolesEnum.ADMIN)
    @ApiOperation({ summary: 'Obtener todas las ventas' })
    @ApiResponse({ status: 200, description: 'Lista de ventas', type: [Sale] })
    async findAll(@Query('date') date?: string): Promise<Sale[]> {
        const filters: any = {}
        if (date) filters.date = date
        return await this.salesService.findAll(filters);
    }

    @Get('report')
    @Roles(RolesEnum.STAFF, RolesEnum.ADMIN)
    @ApiOperation({ summary: 'Reporte detallado de ventas con métricas y filtros' })
    @ApiResponse({ status: 200, description: 'Reporte de ventas con métricas y paginación' })
    async report(@Query() filters: SalesReportFilterDto) {
        return await this.salesService.getReport(filters);
    }

    @Post()
    @ApiOperation({ summary: 'Crear una nueva venta con productos (outputs)' })
    @ApiResponse({ status: 201, description: 'Venta creada con outputs', type: Sale })
    @Roles(RolesEnum.STAFF, RolesEnum.ADMIN)
    async create(@Body() payload: { idUser: number; total: number; notes?: string; items?: any[] }, @Req() req: Request): Promise<any> {
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
                const actorId = (req as any).user?.id ?? payload.idUser;
                if (actorId) {
                    await this.auditLogsService.record({
                        actorId,
                        action: 'Crear venta',
                        tableName: 'sales',
                        recordId: Number(sale.id),
                        description: `Registró venta #${sale.id} con ${outputs.length} productos`,
                        newData: this.buildSaleLogPayload(sale, outputs),
                        request: req,
                    });
                }
                await queryRunner.commitTransaction();
                return { sale, outputs };
            }

            await queryRunner.commitTransaction();
            const actorId = (req as any).user?.id ?? payload.idUser;
            if (actorId) {
                await this.auditLogsService.record({
                    actorId,
                    action: 'Crear venta',
                    tableName: 'sales',
                    recordId: Number(sale.id),
                    description: `Registró venta #${sale.id}`,
                    newData: this.buildSaleLogPayload(sale),
                    request: req,
                });
            }
            return { sale };
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }
}

import { BadRequestException, Controller, Get, Post, Body, Inject, Query } from "@nestjs/common";
import { UseGuards } from '@nestjs/common';
import { Roles } from 'src/common/utils/roles.decorator';
import { RolesGuard } from 'src/common/utils/roles.guard';
import { RolesEnum } from 'src/shared/enums/roles.enum';
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { DataSource } from "typeorm";
import { SalesService } from "../services/sales.service";
import { ProductOutputsService } from "src/modules/product_outputs/services/product_outputs.service";
import { Sale } from "../entities/sale.entity";

@ApiTags('Sales')
@Controller("sales")
@UseGuards(RolesGuard)
export class SalesController {
    constructor(
        private readonly salesService: SalesService,
        private readonly productOutputsService: ProductOutputsService,
        private readonly dataSource: DataSource,
    ) {}

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
    @ApiOperation({ summary: 'Reporte de ventas con resumen diario/mensual y paginacion' })
    async report(
        @Query('page') page = '1',
        @Query('limit') limit = '15',
        @Query('targetDate') targetDate?: string,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
        @Query('userId') userId?: string,
        @Query('productId') productId?: string,
    ) {
        const safePage = Math.max(Number(page) || 1, 1);
        const safeLimit = Math.min(Math.max(Number(limit) || 15, 1), 100);
        const offset = (safePage - 1) * safeLimit;

        const today = new Date().toISOString().slice(0, 10);
        const dateKey = targetDate && /^\d{4}-\d{2}-\d{2}$/.test(targetDate) ? targetDate : today;

        const monthStart = `${dateKey.slice(0, 7)}-01`;
        const monthEndDate = new Date(`${monthStart}T00:00:00.000Z`);
        monthEndDate.setUTCMonth(monthEndDate.getUTCMonth() + 1);
        monthEndDate.setUTCDate(0);
        const monthEnd = monthEndDate.toISOString().slice(0, 10);

        const from = startDate && /^\d{4}-\d{2}-\d{2}$/.test(startDate) ? startDate : dateKey;
        const to = endDate && /^\d{4}-\d{2}-\d{2}$/.test(endDate) ? endDate : dateKey;

        const params: any[] = [from, to];
        const where: string[] = [
            `s.created_at BETWEEN $1::timestamp AND $2::timestamp + interval '23 hours 59 minutes 59 seconds'`,
        ];

        if (userId && !Number.isNaN(Number(userId))) {
            params.push(Number(userId));
            where.push(`s.id_user = $${params.length}`);
        }

        if (productId && !Number.isNaN(Number(productId))) {
            params.push(Number(productId));
            where.push(
                `EXISTS (
                    SELECT 1
                    FROM product_outputs po_filter
                    WHERE po_filter.id_sale = s.id_sale AND po_filter.id_product = $${params.length}
                )`,
            );
        }

        const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

        const totalResult = await this.dataSource.query(
            `SELECT COUNT(*)::int AS total
             FROM sales s
             ${whereSql}`,
            params,
        );
        const total = Number(totalResult[0]?.total ?? 0);

        const rowsParams = [...params, safeLimit, offset];
        const rows = await this.dataSource.query(
            `SELECT
                s.id_sale AS id,
                s.total,
                s.notes,
                s.created_at AS "createdAt",
                u.id_user AS "userId",
                u.name AS "userName",
                u.username AS "userUsername",
                r.name AS "userRole"
             FROM sales s
             LEFT JOIN users u ON u.id_user = s.id_user
             LEFT JOIN roles r ON r.id_role = u.id_role
             ${whereSql}
             ORDER BY s.created_at DESC
             LIMIT $${rowsParams.length - 1}
             OFFSET $${rowsParams.length}`,
            rowsParams,
        );

        const saleIds = rows.map((row: any) => Number(row.id));
        let itemsBySale = new Map<number, any[]>();

        if (saleIds.length) {
            const items = await this.dataSource.query(
                `SELECT
                    po.id_sale AS "saleId",
                    po.id_output AS "idOutput",
                    po.id_product AS "productId",
                    p.name AS "productName",
                    b.name AS "brandName",
                    pt.name AS "typeName",
                    po.quantity,
                    po.unit_price AS "unitPrice",
                    po.subtotal
                 FROM product_outputs po
                 INNER JOIN products p ON p.id_product = po.id_product
                 LEFT JOIN brands b ON b.id_brand = p.id_brand
                 LEFT JOIN product_types pt ON pt.id_type = p.id_type
                 WHERE po.id_sale = ANY($1)
                 ORDER BY po.id_output ASC`,
                [saleIds],
            );

            itemsBySale = items.reduce((acc: Map<number, any[]>, item: any) => {
                const key = Number(item.saleId);
                const current = acc.get(key) ?? [];
                current.push(item);
                acc.set(key, current);
                return acc;
            }, new Map<number, any[]>());
        }

        const data = rows.map((row: any) => ({
            id: Number(row.id),
            total: Number(row.total ?? 0),
            notes: row.notes ?? null,
            createdAt: row.createdAt,
            user: {
                id: Number(row.userId ?? 0),
                name: row.userName ?? '',
                username: row.userUsername ?? '',
                roleName: row.userRole ?? undefined,
            },
            items: itemsBySale.get(Number(row.id)) ?? [],
        }));

        const [dayTotalResult, monthTotalResult, daySalesRaw] = await Promise.all([
            this.dataSource.query(
                `SELECT COALESCE(SUM(total), 0)::float AS total
                 FROM sales
                 WHERE created_at BETWEEN $1::timestamp AND $1::timestamp + interval '23 hours 59 minutes 59 seconds'`,
                [dateKey],
            ),
            this.dataSource.query(
                `SELECT COALESCE(SUM(total), 0)::float AS total
                 FROM sales
                 WHERE created_at BETWEEN $1::timestamp AND $2::timestamp + interval '23 hours 59 minutes 59 seconds'`,
                [monthStart, monthEnd],
            ),
            this.dataSource.query(
                `SELECT
                    s.id_sale AS id,
                    s.total,
                    s.notes,
                    s.created_at AS "createdAt",
                    u.id_user AS "userId",
                    u.name AS "userName",
                    u.username AS "userUsername",
                    r.name AS "userRole"
                 FROM sales s
                 LEFT JOIN users u ON u.id_user = s.id_user
                 LEFT JOIN roles r ON r.id_role = u.id_role
                 WHERE s.created_at BETWEEN $1::timestamp AND $1::timestamp + interval '23 hours 59 minutes 59 seconds'
                 ORDER BY s.created_at DESC`,
                [dateKey],
            ),
        ]);

        const summaryDaySales = daySalesRaw.map((row: any) => ({
            id: Number(row.id),
            total: Number(row.total ?? 0),
            notes: row.notes ?? null,
            createdAt: row.createdAt,
            user: {
                id: Number(row.userId ?? 0),
                name: row.userName ?? '',
                username: row.userUsername ?? '',
                roleName: row.userRole ?? undefined,
            },
            items: itemsBySale.get(Number(row.id)) ?? [],
        }));

        return {
            summary: {
                dayTotal: Number(dayTotalResult[0]?.total ?? 0),
                monthTotal: Number(monthTotalResult[0]?.total ?? 0),
                totalCount: total,
                targetDate: dateKey,
                monthStart,
                monthEnd,
                daySales: summaryDaySales,
            },
            data,
            pagination: {
                page: safePage,
                limit: safeLimit,
                total,
            },
        };
    }

    @Post()
    @ApiOperation({ summary: 'Crear una nueva venta con productos (outputs)' })
    @ApiResponse({ status: 201, description: 'Venta creada con outputs', type: Sale })
    @Roles(RolesEnum.STAFF, RolesEnum.ADMIN)
    async create(@Body() payload: { idUser: number; total: number; notes?: string; items?: any[] }): Promise<any> {
        // Use transaction to ensure consistency
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Create sale
            const sale = await this.salesService.create({
                idUser: payload.idUser,
                total: payload.total,
                notes: payload.notes,
            }, queryRunner.manager);

            // Create product outputs if provided
            if (payload.items && Array.isArray(payload.items) && payload.items.length > 0) {
                const outputs = await this.productOutputsService.createManyForSale(
                    sale.id,
                    payload.items,
                    queryRunner.manager
                );
                await queryRunner.commitTransaction();
                return { sale, outputs };
            }

            await queryRunner.commitTransaction();
            return { sale };
        } catch (error) {
            await queryRunner.rollbackTransaction();
            const rawMessage = String((error as any)?.message ?? '').toLowerCase();
            if (rawMessage.includes('stock') || rawMessage.includes('insuficiente') || rawMessage.includes('out of stock')) {
                throw new BadRequestException((error as any)?.message || 'Stock insuficiente para completar la venta');
            }
            throw error;
        } finally {
            await queryRunner.release();
        }
    }
}

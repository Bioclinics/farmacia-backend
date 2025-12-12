import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, EntityManager } from "typeorm";
import { Sale } from "../entities/sale.entity";
import { ProductOutput } from "src/modules/product_outputs/entities/product_output.entity";
import { Product } from "src/modules/products/entities/product.entity";
import { SalesReportFilterDto } from "../dto/sales-report-filter.dto";

type ReportProductItem = {
    idOutput: number;
    productId: number;
    productName: string;
    brandName?: string;
    typeName?: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
};

type ReportSaleItem = {
    id: number;
    total: number;
    createdAt: Date;
    notes: string | null;
    user: {
        id: number;
        name: string;
        username: string;
        roleName?: string;
    } | null;
    items: ReportProductItem[];
};

type ReportSummary = {
    dayTotal: number;
    monthTotal: number;
    totalCount: number;
    targetDate: string;
    monthStart: string;
    monthEnd: string;
    daySales?: ReportSaleItem[];
};

type SalesReportResult = {
    summary: ReportSummary;
    data: ReportSaleItem[];
    pagination: {
        page: number;
        limit: number;
        total: number;
    };
};

@Injectable()
export class SalesService {
    constructor(
        @InjectRepository(Sale)
        private readonly salesRepository: Repository<Sale>,
        @InjectRepository(ProductOutput)
        private readonly productOutputsRepository: Repository<ProductOutput>,
    ) {}

    async findAll(filters?: { date?: string }): Promise<Sale[]> {
        const qb = this.salesRepository.createQueryBuilder('sale')
            .leftJoinAndSelect('sale.user', 'user')
            .orderBy('sale.created_at', 'DESC');

        if (filters?.date) {
            // filter by exact day (UTC)
            const start = `${filters.date}T00:00:00.000Z`
            const end = `${filters.date}T23:59:59.999Z`
            qb.andWhere('sale.created_at BETWEEN :start AND :end', { start, end })
        }

        return await qb.getMany();
    }

    async create(payload: { idUser: number; total: number; notes?: string }, manager?: EntityManager): Promise<Sale> {
        const repo = manager ? manager.getRepository(Sale) : this.salesRepository;
        const newSale = repo.create({
            idUser: payload.idUser,
            total: payload.total,
            notes: payload.notes ?? null,
        } as Partial<Sale>);

        return await repo.save(newSale);
    }

    async getReport(filters: SalesReportFilterDto): Promise<SalesReportResult> {
        const page = filters.page && filters.page > 0 ? filters.page : 1;
        const limit = filters.limit && filters.limit > 0 ? filters.limit : 20;
        const skip = (page - 1) * limit;

        const productSaleIds = await this.resolveSaleIdsByProduct(filters);
        const filteredSaleIds = this.combineSaleIds(productSaleIds, filters.saleId);

        if (filteredSaleIds?.length === 0) {
            return {
                summary: this.buildEmptySummary(filters),
                data: [],
                pagination: { page, limit, total: 0 },
            };
        }

        const salesQuery = this.salesRepository.createQueryBuilder('sale')
            .leftJoinAndSelect('sale.user', 'user');

        this.applyCommonFilters(salesQuery, filters, filteredSaleIds);

        const total = await salesQuery.clone().getCount();
        const sales = await salesQuery
            .orderBy('sale.created_at', 'DESC')
            .skip(skip)
            .take(limit)
            .getMany();

        const saleIds = sales.map(s => Number(s.id));
        const itemsBySale = await this.loadOutputsForSales(saleIds);

        const summary = await this.buildSummary(filters, filteredSaleIds);
        summary.totalCount = total;

        const data: ReportSaleItem[] = sales.map((sale) => ({
            id: Number(sale.id),
            total: this.toNumber(sale.total),
            createdAt: sale.created_at,
            notes: sale.notes ?? null,
            user: sale.user ? {
                id: Number((sale.user as any).id ?? (sale.user as any).id_user ?? sale.user.id),
                name: sale.user.name,
                username: sale.user.username,
                roleName: sale.user.role?.name,
            } : null,
            items: itemsBySale.get(Number(sale.id)) ?? [],
        }));

        return {
            summary,
            data,
            pagination: {
                page,
                limit,
                total,
            },
        };
    }

    private async resolveSaleIdsByProduct(filters: SalesReportFilterDto): Promise<number[] | null> {
        if (!filters.productId) {
            return null;
        }

        const rows = await this.productOutputsRepository.createQueryBuilder('output')
            .select('DISTINCT output.id_sale', 'saleId')
            .where('output.id_product = :productId', { productId: filters.productId })
            .getRawMany();

        return rows.map(r => Number(r.saleId)).filter(id => !Number.isNaN(id));
    }

    private applyCommonFilters(qb: any, filters: SalesReportFilterDto, saleIds: number[] | null) {
        if (filters.startDate) {
            qb.andWhere('sale.created_at >= :startDate', { startDate: this.buildStartOfDayIso(filters.startDate) });
        }

        if (filters.endDate) {
            qb.andWhere('sale.created_at <= :endDate', { endDate: this.buildEndOfDayIso(filters.endDate) });
        }

        if (filters.userId) {
            qb.andWhere('sale.id_user = :userId', { userId: filters.userId });
        }

        if (filters.saleId) {
            qb.andWhere('sale.id = :saleId', { saleId: filters.saleId });
        }

        if (saleIds && saleIds.length > 0) {
            qb.andWhere('sale.id IN (:...saleIds)', { saleIds });
        }
    }

    private async loadOutputsForSales(saleIds: number[]): Promise<Map<number, ReportProductItem[]>> {
        const grouped = new Map<number, ReportProductItem[]>();
        if (!saleIds.length) {
            return grouped;
        }

        const outputs = await this.productOutputsRepository.createQueryBuilder('output')
            .leftJoin(Product, 'product', 'product.id_product = output.id_product')
            .leftJoin('product.brand', 'brand')
            .leftJoin('product.productType', 'ptype')
            .select([
                'output.id_output AS idOutput',
                'output.id_sale AS saleId',
                'output.id_product AS productId',
                'output.quantity AS quantity',
                'output.unit_price AS unitPrice',
                'output.subtotal AS subtotal',
                'product.name AS productName',
                'brand.name AS brandName',
                'ptype.name AS typeName',
            ])
            .where('output.id_sale IN (:...saleIds)', { saleIds })
            .orderBy('output.id_sale', 'ASC')
            .addOrderBy('output.id_output', 'ASC')
            .getRawMany();

        outputs.forEach(raw => {
            const saleId = Number(raw.saleId);
            if (Number.isNaN(saleId)) return;
            const list = grouped.get(saleId) ?? [];
            list.push({
                idOutput: Number(raw.idOutput),
                productId: Number(raw.productId),
                productName: raw.productName,
                brandName: raw.brandName ?? undefined,
                typeName: raw.typeName ?? undefined,
                quantity: Number(raw.quantity),
                unitPrice: this.toNumber(raw.unitPrice),
                subtotal: this.toNumber(raw.subtotal),
            });
            grouped.set(saleId, list);
        });

        return grouped;
    }

    private async buildSummary(filters: SalesReportFilterDto, saleIds: number[] | null): Promise<ReportSummary> {
        const target = this.resolveTargetDate(filters);
        const targetKey = this.formatDateKey(target);
        const monthStartDate = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth(), 1));
        const monthEndDate = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0));

        const dayTotal = await this.aggregateTotal(targetKey, targetKey, filters, saleIds);

        const monthStartKey = this.formatDateKey(monthStartDate);
        const monthEndKey = this.formatDateKey(monthEndDate);

        const monthTotal = await this.aggregateTotal(
            monthStartKey,
            monthEndKey,
            filters,
            saleIds,
        );

        // Also fetch the list of sales for the target day (filter by date() to avoid timezone issues)
        const daySalesQuery = this.salesRepository.createQueryBuilder('sale')
            .leftJoinAndSelect('sale.user', 'user')
            .where('sale.created_at BETWEEN :start AND :end', this.buildLocalDayRange(targetKey));

        if (filters.userId) {
            daySalesQuery.andWhere('sale.id_user = :userId', { userId: filters.userId });
        }
        if (filters.saleId) {
            daySalesQuery.andWhere('sale.id = :saleId', { saleId: filters.saleId });
        }
        if (saleIds && saleIds.length > 0) {
            daySalesQuery.andWhere('sale.id IN (:...saleIds)', { saleIds });
        }

        const daySalesRaw = await daySalesQuery.orderBy('sale.created_at', 'DESC').getMany();
        const daySaleIds = daySalesRaw.map(s => Number(s.id));
        const dayItemsMap = await this.loadOutputsForSales(daySaleIds);
        const daySales: ReportSaleItem[] = daySalesRaw.map(s => ({
            id: Number(s.id),
            total: this.toNumber(s.total),
            createdAt: s.created_at,
            notes: s.notes ?? null,
            user: s.user ? { id: Number((s.user as any).id ?? 0), name: s.user.name, username: s.user.username, roleName: s.user.role?.name } : null,
            items: dayItemsMap.get(Number(s.id)) ?? [],
        }));

        return {
            dayTotal,
            monthTotal,
            totalCount: 0,
            targetDate: targetKey,
            monthStart: monthStartKey,
            monthEnd: monthEndKey,
            daySales,
        };
    }

    private buildEmptySummary(filters: SalesReportFilterDto): ReportSummary {
        const target = this.resolveTargetDate(filters);
        const targetKey = this.formatDateKey(target);
        const monthStart = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth(), 1));
        const monthEnd = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0));

        return {
            dayTotal: 0,
            monthTotal: 0,
            totalCount: 0,
            targetDate: targetKey,
            monthStart: this.formatDateKey(monthStart),
            monthEnd: this.formatDateKey(monthEnd),
        };
    }

    private resolveTargetDate(filters: SalesReportFilterDto): Date {
        const value = filters.targetDate ?? filters.startDate;
        if (!value) {
            return new Date();
        }
        const parsed = new Date(value);
        return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
    }

    private formatDateKey(date: Date): string {
        const year = date.getUTCFullYear();
        const month = String(date.getUTCMonth() + 1).padStart(2, '0');
        const day = String(date.getUTCDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    private buildStartOfDayIso(value: string): string {
        const parsed = new Date(value);
        if (Number.isNaN(parsed.getTime())) {
            return value;
        }
        const key = this.formatDateKey(parsed);
        return `${key} 00:00:00`;
    }

    private buildEndOfDayIso(value: string): string {
        const parsed = new Date(value);
        if (Number.isNaN(parsed.getTime())) {
            return value;
        }
        const key = this.formatDateKey(parsed);
        return `${key} 23:59:59.999`;
    }

    private buildLocalDayRange(key: string): { start: string; end: string } {
        return {
            start: `${key} 00:00:00`,
            end: `${key} 23:59:59.999`,
        };
    }

    private async aggregateTotal(startKey: string, endKey: string, filters: SalesReportFilterDto, saleIds: number[] | null): Promise<number> {
        const start = `${startKey} 00:00:00`;
        const end = `${endKey} 23:59:59.999`;
        const qb = this.salesRepository.createQueryBuilder('sale')
            .select('COALESCE(SUM(sale.total), 0)', 'sum')
            .where('sale.created_at BETWEEN :start AND :end', { start, end });

        if (filters.userId) {
            qb.andWhere('sale.id_user = :userId', { userId: filters.userId });
        }

        if (filters.saleId) {
            qb.andWhere('sale.id = :saleId', { saleId: filters.saleId });
        }

        if (saleIds && saleIds.length > 0) {
            qb.andWhere('sale.id IN (:...saleIds)', { saleIds });
        }

        const raw = await qb.getRawOne<{ sum: string | number | null }>();
        return this.toNumber(raw?.sum ?? 0);
    }

    private combineSaleIds(productSaleIds: number[] | null, saleId?: number): number[] | null {
        if (saleId && productSaleIds) {
            return productSaleIds.includes(saleId) ? [saleId] : [];
        }

        if (saleId) {
            return [saleId];
        }

        return productSaleIds;
    }

    private toNumber(value: any): number {
        if (typeof value === 'number') return value;
        if (typeof value === 'string') {
            const parsed = Number(value);
            return Number.isNaN(parsed) ? 0 : parsed;
        }
        return 0;
    }
}

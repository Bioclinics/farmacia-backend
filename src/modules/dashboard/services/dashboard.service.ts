import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Sale } from 'src/modules/sales/entities/sale.entity';
import { Product } from 'src/modules/products/entities/product.entity';
import { ProductInput } from 'src/modules/product_inputs/entities/product_input.entity';
import { ProductOutput } from 'src/modules/product_outputs/entities/product_output.entity';
import { ProductComposition } from 'src/modules/compositions/entities/product_composition.entity';
import { Composition } from 'src/modules/compositions/entities/composition.entity';
import { DashboardKpisQueryDto } from '../dto/dashboard-kpis.query';
import { DashboardAlertsQueryDto } from '../dto/dashboard-alerts.query';
import { DashboardTrendQueryDto } from '../dto/dashboard-trend.query';
import { DashboardTopProductsQueryDto } from '../dto/dashboard-top-products.query';
import { DashboardInventoryMovementsQueryDto } from '../dto/dashboard-inventory-movements.query';

export type DashboardKpis = {
  salesToday: number;
  revenueToday: number;
  salesThisMonth: number;
  averageTicketToday: number;
  catalogProducts: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  inputsToday: number;
  outputsToday: number;
};

export type DashboardInventoryAlert = {
  productId: number;
  name: string;
  stock: number;
  minStock: number;
  severity: 'warning' | 'critical';
};

export type DashboardTrendPoint = {
  date: string;
  salesCount: number;
  totalAmount: number;
};

export type DashboardTopProduct = {
  productId: number;
  name: string;
  quantity: number;
  amount: number;
};

export type DashboardTopActive = {
  compositionId: number;
  name: string;
  quantity: number;
};

export type DashboardInventoryMovement = {
  type: 'input' | 'output';
  productId: number;
  name: string;
  quantity: number;
  createdAt: string;
};

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Sale)
    private readonly salesRepository: Repository<Sale>,
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
    @InjectRepository(ProductInput)
    private readonly inputsRepository: Repository<ProductInput>,
    @InjectRepository(ProductOutput)
    private readonly outputsRepository: Repository<ProductOutput>,
  ) {}

  async getKpis(query: DashboardKpisQueryDto): Promise<DashboardKpis> {
    const targetDate = this.parseDate(query?.date);
    const dayRange = this.buildDayRange(targetDate);
    const monthRange = this.buildMonthRange(targetDate);

    const lowStockThreshold = typeof query?.lowStockThreshold === 'number' && query.lowStockThreshold >= 0 ? query.lowStockThreshold : 10;

    const [salesTodayRaw, salesMonthRaw, catalogRaw, lowStockRaw, outOfStockRaw, inputsTodayRaw, outputsTodayRaw] = await Promise.all([
      this.salesRepository
        .createQueryBuilder('sale')
        .select('COUNT(*)', 'count')
        .addSelect('COALESCE(SUM(sale.total), 0)', 'sum')
        .where('sale.created_at BETWEEN :start AND :end', dayRange)
        .getRawOne<{ count: string | number | null; sum: string | number | null }>(),
      this.salesRepository
        .createQueryBuilder('sale')
        .select('COUNT(*)', 'count')
        .where('sale.created_at BETWEEN :start AND :end', monthRange)
        .getRawOne<{ count: string | number | null }>(),
      this.productsRepository
        .createQueryBuilder('product')
        .select('COUNT(*)', 'count')
        .where('product.is_active = :active', { active: true })
        .andWhere('product.is_deleted = :deleted', { deleted: false })
        .getRawOne<{ count: string | number | null }>(),
      this.productsRepository
        .createQueryBuilder('product')
        .select('COUNT(*)', 'count')
        .where('product.is_active = :active', { active: true })
        .andWhere('product.is_deleted = :deleted', { deleted: false })
        .andWhere('product.stock > 0')
        .andWhere('product.stock <= GREATEST(product.min_stock, :threshold)', { threshold: lowStockThreshold })
        .getRawOne<{ count: string | number | null }>(),
      this.productsRepository
        .createQueryBuilder('product')
        .select('COUNT(*)', 'count')
        .where('product.is_active = :active', { active: true })
        .andWhere('product.is_deleted = :deleted', { deleted: false })
        .andWhere('product.stock <= 0')
        .getRawOne<{ count: string | number | null }>(),
      this.inputsRepository
        .createQueryBuilder('input')
        .select('COUNT(*)', 'count')
        .where('input.created_at BETWEEN :start AND :end', dayRange)
        .getRawOne<{ count: string | number | null }>(),
      this.outputsRepository
        .createQueryBuilder('output')
        .select('COUNT(*)', 'count')
        .where('output.created_at BETWEEN :start AND :end', dayRange)
        .andWhere('(output.is_adjustment = false OR output.is_adjustment IS NULL)')
        .getRawOne<{ count: string | number | null }>(),
    ]);

    const salesToday = this.toNumber(salesTodayRaw?.count ?? 0);
    const revenueToday = this.toNumber(salesTodayRaw?.sum ?? 0);
    const salesThisMonth = this.toNumber(salesMonthRaw?.count ?? 0);
    const catalogProducts = this.toNumber(catalogRaw?.count ?? 0);
    const lowStockProducts = this.toNumber(lowStockRaw?.count ?? 0);
    const outOfStockProducts = this.toNumber(outOfStockRaw?.count ?? 0);
    const inputsToday = this.toNumber(inputsTodayRaw?.count ?? 0);
    const outputsToday = this.toNumber(outputsTodayRaw?.count ?? 0);

    const averageTicketToday = salesToday > 0 ? this.roundTwo(revenueToday / salesToday) : 0;

    return {
      salesToday,
      revenueToday: this.roundTwo(revenueToday),
      salesThisMonth,
      averageTicketToday,
      catalogProducts,
      lowStockProducts,
      outOfStockProducts,
      inputsToday,
      outputsToday,
    };
  }

  async getInventoryAlerts(query: DashboardAlertsQueryDto): Promise<DashboardInventoryAlert[]> {
    const threshold = typeof query.threshold === 'number' ? query.threshold : 10;
    const limit = typeof query.limit === 'number' ? query.limit : 20;

    const rows = await this.productsRepository
      .createQueryBuilder('product')
      .select('product.id_product', 'productId')
      .addSelect('product.name', 'name')
      .addSelect('product.stock', 'stock')
      .addSelect('product.min_stock', 'minStock')
      .addSelect(`CASE WHEN product.stock <= 0 THEN 'critical' WHEN product.stock <= GREATEST(product.min_stock, :threshold) THEN 'warning' END`, 'severity')
      .where('product.is_active = :active', { active: true })
      .andWhere('product.is_deleted = :deleted', { deleted: false })
      .andWhere('(product.stock <= 0 OR product.stock <= GREATEST(product.min_stock, :threshold))', { threshold })
      .orderBy("CASE WHEN product.stock <= 0 THEN 0 ELSE 1 END", 'ASC')
      .addOrderBy('product.stock', 'ASC')
      .limit(limit)
      .getRawMany<{ productId: number; name: string; stock: number; minStock: number; severity: 'warning' | 'critical' }>();

    return rows.map((row) => ({
      productId: Number(row.productId),
      name: row.name,
      stock: Number(row.stock ?? 0),
      minStock: Number(row.minStock ?? 0),
      severity: row.severity === 'critical' ? 'critical' : 'warning',
    }));
  }

  async getSalesTrend(query: DashboardTrendQueryDto): Promise<DashboardTrendPoint[]> {
    const endDate = this.parseDate(query.endDate);
    const days = query.days && query.days > 0 ? Math.min(query.days, 90) : 10;
    const startDate = query.startDate ? this.parseDate(query.startDate) : new Date(endDate);
    startDate.setDate(endDate.getDate() - (days - 1));

    const range = this.buildExactRange(startDate, endDate);

    const rows = await this.salesRepository
      .createQueryBuilder('sale')
      .select("DATE(sale.created_at)", 'date')
      .addSelect('COUNT(*)', 'totalCount')
      .addSelect('COALESCE(SUM(sale.total), 0)', 'totalAmount')
      .where('sale.created_at BETWEEN :start AND :end', range)
      .groupBy('DATE(sale.created_at)')
      .orderBy('DATE(sale.created_at)', 'ASC')
      .getRawMany<{ date: string; totalCount: string | number; totalAmount: string | number }>();

    const points: DashboardTrendPoint[] = [];
    const cursor = new Date(startDate);
    const dateMap = new Map<string, { totalCount: number; totalAmount: number }>();
    rows.forEach((row) => {
      const key = this.formatDateKey(row.date);
      dateMap.set(key, { totalCount: this.toNumber(row.totalCount), totalAmount: this.toNumber(row.totalAmount) });
    });

    while (cursor <= endDate) {
      const key = this.formatDateKey(cursor);
      const value = dateMap.get(key) ?? { totalCount: 0, totalAmount: 0 };
      points.push({ date: key, salesCount: value.totalCount, totalAmount: this.roundTwo(value.totalAmount) });
      cursor.setDate(cursor.getDate() + 1);
    }

    return points;
  }

  async getTopProducts(query: DashboardTopProductsQueryDto): Promise<DashboardTopProduct[]> {
    const limit = query.limit && query.limit > 0 ? Math.min(query.limit, 20) : 5;
    const { start, end } = this.resolveRange(query.startDate, query.endDate, 30);

    const rows = await this.outputsRepository
      .createQueryBuilder('output')
      .innerJoin(Product, 'product', 'product.id_product = output.id_product')
      .select('product.id_product', 'productId')
      .addSelect('product.name', 'name')
      .addSelect('COALESCE(SUM(output.quantity), 0)', 'totalQuantity')
      .addSelect('COALESCE(SUM(output.subtotal), 0)', 'totalAmount')
      .where('(output.is_adjustment = false OR output.is_adjustment IS NULL)')
      .andWhere('output.id_sale IS NOT NULL')
      .andWhere('output.created_at BETWEEN :start AND :end', { start, end })
      .groupBy('product.id_product')
      .addGroupBy('product.name')
      .orderBy('COALESCE(SUM(output.quantity), 0)', 'DESC')
      .addOrderBy('COALESCE(SUM(output.subtotal), 0)', 'DESC')
      .limit(limit)
      .getRawMany<{ productId: number; name: string; totalQuantity: string | number; totalAmount: string | number }>();

    return rows.map((row) => ({
      productId: Number(row.productId),
      name: row.name,
      quantity: this.toNumber(row.totalQuantity),
      amount: this.roundTwo(this.toNumber(row.totalAmount)),
    }));
  }

  async getTopActives(query: DashboardTopProductsQueryDto): Promise<DashboardTopActive[]> {
    const limit = query.limit && query.limit > 0 ? Math.min(query.limit, 20) : 5;
    const { start, end } = this.resolveRange(query.startDate, query.endDate, 30);

    const rows = await this.outputsRepository
      .createQueryBuilder('output')
      .innerJoin(Product, 'product', 'product.id_product = output.id_product')
      .innerJoin(ProductComposition, 'pc', 'pc.id_product = product.id_product')
      .innerJoin(Composition, 'composition', 'composition.id_composition = pc.id_composition')
      .select('composition.id_composition', 'compositionId')
      .addSelect('composition.name', 'name')
      .addSelect('COALESCE(SUM(output.quantity), 0)', 'totalQuantity')
      .where('(output.is_adjustment = false OR output.is_adjustment IS NULL)')
      .andWhere('output.id_sale IS NOT NULL')
      .andWhere('output.created_at BETWEEN :start AND :end', { start, end })
      .groupBy('composition.id_composition')
      .addGroupBy('composition.name')
      .orderBy('COALESCE(SUM(output.quantity), 0)', 'DESC')
      .limit(limit)
      .getRawMany<{ compositionId: number; name: string; totalQuantity: string | number }>();

    return rows.map((row) => ({
      compositionId: Number(row.compositionId),
      name: row.name,
      quantity: this.toNumber(row.totalQuantity),
    }));
  }

  async getInventoryMovements(query: DashboardInventoryMovementsQueryDto): Promise<DashboardInventoryMovement[]> {
    const targetDate = this.parseDate(query.date);
    const dayRange = this.buildDayRange(targetDate);
    const limit = query.limit && query.limit > 0 ? Math.min(query.limit, 20) : 10;

    const [inputs, outputs] = await Promise.all([
      this.inputsRepository
        .createQueryBuilder('input')
        .innerJoin(Product, 'product', 'product.id_product = input.id_product')
        .select('input.id_input', 'id')
        .addSelect('product.id_product', 'productId')
        .addSelect('product.name', 'name')
        .addSelect('input.quantity', 'quantity')
        .addSelect('input.created_at', 'createdAt')
        .where('input.created_at BETWEEN :start AND :end', dayRange)
        .orderBy('input.created_at', 'DESC')
        .limit(limit)
        .getRawMany<{ id: number; productId: number; name: string; quantity: number; createdAt: Date }>(),
      this.outputsRepository
        .createQueryBuilder('output')
        .innerJoin(Product, 'product', 'product.id_product = output.id_product')
        .select('output.id_output', 'id')
        .addSelect('product.id_product', 'productId')
        .addSelect('product.name', 'name')
        .addSelect('output.quantity', 'quantity')
        .addSelect('output.created_at', 'createdAt')
        .where('output.created_at BETWEEN :start AND :end', dayRange)
        .andWhere('(output.is_adjustment = false OR output.is_adjustment IS NULL)')
        .orderBy('output.created_at', 'DESC')
        .limit(limit)
        .getRawMany<{ id: number; productId: number; name: string; quantity: number; createdAt: Date }>(),
    ]);

    const sanitize = (item: { productId: number; name: string; quantity: number; createdAt: Date }, type: 'input' | 'output'): DashboardInventoryMovement => ({
      type,
      productId: Number(item.productId),
      name: item.name,
      quantity: this.toNumber(item.quantity),
      createdAt: this.formatDateTime(item.createdAt),
    });

    return [
      ...inputs.map((item) => sanitize(item, 'input')),
      ...outputs.map((item) => sanitize(item, 'output')),
    ].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }

  private parseDate(value?: string): Date {
    if (!value) {
      return new Date();
    }
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return new Date();
    }
    return parsed;
  }

  private resolveRange(start?: string, end?: string, fallbackDays = 30): { start: string; end: string } {
    const endDate = end ? this.parseDate(end) : new Date();
    const startDate = start ? this.parseDate(start) : new Date(endDate);
    if (!start) {
      startDate.setDate(endDate.getDate() - (fallbackDays - 1));
    }
    if (startDate > endDate) {
      return this.buildExactRange(endDate, startDate);
    }
    return this.buildExactRange(startDate, endDate);
  }

  private buildDayRange(date: Date): { start: string; end: string } {
    const key = this.formatDateKey(date);
    return {
      start: `${key} 00:00:00`,
      end: `${key} 23:59:59.999`,
    };
  }

  private buildMonthRange(date: Date): { start: string; end: string } {
    const start = new Date(date.getFullYear(), date.getMonth(), 1);
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    return this.buildExactRange(start, end);
  }

  private buildExactRange(startDate: Date, endDate: Date): { start: string; end: string } {
    const [safeStart, safeEnd] = startDate <= endDate ? [startDate, endDate] : [endDate, startDate];
    const startKey = this.formatDateKey(safeStart);
    const endKey = this.formatDateKey(safeEnd);
    return {
      start: `${startKey} 00:00:00`,
      end: `${endKey} 23:59:59.999`,
    };
  }

  private formatDateKey(value: Date | string): string {
    const date = typeof value === 'string' ? new Date(value) : value;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private formatDateTime(value: Date | string): string {
    const date = typeof value === 'string' ? new Date(value) : value;
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const hh = String(date.getHours()).padStart(2, '0');
    const mm = String(date.getMinutes()).padStart(2, '0');
    return `${y}-${m}-${d} ${hh}:${mm}`;
  }

  private toNumber(value: any): number {
    if (typeof value === 'number') {
      return value;
    }
    if (typeof value === 'string') {
      const parsed = Number(value);
      return Number.isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  }

  private roundTwo(value: number): number {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }
}

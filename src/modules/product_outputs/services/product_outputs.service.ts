import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager, SelectQueryBuilder } from 'typeorm';
import { ProductOutput } from '../entities/product_output.entity';
import { CreateProductOutputDto } from '../dto/create_product_output.dto';
import { UpdateProductOutputDto } from '../dto/update_product_output.dto';
import { ProductOutputFiltersDto } from '../dto/product-output-filters.dto';
import { Product } from 'src/modules/products/entities/product.entity';
import { ProductInput } from 'src/modules/product_inputs/entities/product_input.entity';
import { Sale } from 'src/modules/sales/entities/sale.entity';
import { User } from 'src/modules/users/entities/user.entity';
import { Brand } from 'src/modules/brands/entities/brand.entity';
import { ProductType } from 'src/modules/product_types/entities/product_type.entity';

type OutputResponsible = {
  id: number;
  name: string;
  username?: string;
};

type OutputListItem = {
  id: number;
  idSale: number | null;
  isAdjustment: boolean;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  reason: string | null;
  createdAt: Date | string;
  product: {
    id: number;
    name: string;
    price?: number;
    brandName?: string;
    typeName?: string;
  } | null;
  responsible: OutputResponsible | null;
};

type OutputSummary = {
  period: {
    startDate: string | null;
    endDate: string | null;
  };
  outputs: {
    count: number;
    totalQuantity: number;
    totalSubtotal: number;
  };
  entries: {
    count: number;
    totalQuantity: number;
    totalSubtotal: number;
  };
};
@Injectable()
export class ProductOutputsService {
  constructor(
    @InjectRepository(ProductOutput)
    private readonly productOutputsRepository: Repository<ProductOutput>,
    @InjectRepository(ProductInput)
    private readonly productInputsRepository: Repository<ProductInput>,
  ) {}

  async findAll(filters: ProductOutputFiltersDto): Promise<{
    summary: OutputSummary;
    data: OutputListItem[];
    pagination: { page: number; limit: number; total: number };
  }> {
    const page = filters?.page && filters.page > 0 ? filters.page : 1;
    const limit = filters?.limit && filters.limit > 0 ? filters.limit : 25;
    const skip = (page - 1) * limit;

    const baseQuery = this.createBaseQuery(filters);
    const total = await baseQuery.clone().getCount();

    const rows = await baseQuery
      .select([
        'o.id_output AS id_output',
        'o.id_sale AS id_sale',
        'o.id_product AS id_product',
        'o.quantity AS quantity',
        'o.unit_price AS unit_price',
        'o.subtotal AS subtotal',
        'o.is_adjustment AS is_adjustment',
        'o.reason AS reason',
        'o.created_at AS created_at',
        'p.id_product AS product_id',
        'p.name AS product_name',
        'p.price AS product_price',
        'b.name AS brand_name',
        'pt.name AS type_name',
        's.id_sale AS sale_id',
        'u.id_user AS user_id',
        'u.name AS user_name',
        'u.username AS user_username',
      ])
      .orderBy('o.created_at', 'DESC')
      .skip(skip)
      .take(limit)
      .getRawMany();

    const data: OutputListItem[] = rows.map((row) => {
      const productId = this.toNumber(row.product_id ?? row.id_product ?? row.idProduct);
      const responsibleId = this.toNumber(row.user_id);

      const product = row.product_name
        ? {
            id: productId,
            name: row.product_name,
            price: this.toNumber(row.product_price),
            brandName: row.brand_name ?? undefined,
            typeName: row.type_name ?? undefined,
          }
        : null;

      const responsible: OutputResponsible | null = responsibleId
        ? {
            id: responsibleId,
            name: row.user_name ?? '',
            username: row.user_username ?? undefined,
          }
        : null;

      return {
        id: this.toNumber(row.id_output),
        idSale: row.sale_id ? this.toNumber(row.sale_id) : null,
        isAdjustment: Boolean(row.is_adjustment),
        quantity: this.toNumber(row.quantity),
        unitPrice: this.toNumber(row.unit_price),
        subtotal: this.toNumber(row.subtotal),
        reason: row.reason ?? null,
        createdAt: row.created_at,
        product,
        responsible,
      };
    });

    const summary = await this.buildSummary(filters);

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

  private createBaseQuery(filters: ProductOutputFiltersDto): SelectQueryBuilder<ProductOutput> {
    const qb = this.productOutputsRepository.createQueryBuilder('o')
      .leftJoin(Product, 'p', 'p.id_product = o.id_product')
      .leftJoin(Brand, 'b', 'b.id_brand = p.id_brand')
      .leftJoin(ProductType, 'pt', 'pt.id_type = p.id_type')
      .leftJoin(Sale, 's', 's.id_sale = o.id_sale')
      .leftJoin(User, 'u', 'u.id_user = s.id_user');

    this.applyFilters(qb, filters);
    return qb;
  }

  private applyFilters(qb: SelectQueryBuilder<ProductOutput>, filters: ProductOutputFiltersDto) {
    if (filters.startDate) {
      qb.andWhere('o.created_at >= :startDate', { startDate: this.buildStartOfDayIso(filters.startDate) });
    }

    if (filters.endDate) {
      qb.andWhere('o.created_at <= :endDate', { endDate: this.buildEndOfDayIso(filters.endDate) });
    }

    if (filters.productId) {
      qb.andWhere('o.id_product = :productId', { productId: filters.productId });
    }

    if (filters.laboratoryId) {
      qb.andWhere('p.id_brand = :laboratoryId', { laboratoryId: filters.laboratoryId });
    }

    if (filters.userId) {
      qb.andWhere('s.id_user = :userId', { userId: filters.userId });
    }

    if (filters.saleId) {
      qb.andWhere('o.id_sale = :saleId', { saleId: filters.saleId });
    }
  }

  private async buildSummary(filters: ProductOutputFiltersDto): Promise<OutputSummary> {
    const outputs = await this.aggregateOutputs(filters);
    const entries = await this.aggregateEntries(filters);

    return {
      period: {
        startDate: filters.startDate ?? null,
        endDate: filters.endDate ?? null,
      },
      outputs,
      entries,
    };
  }

  private async aggregateOutputs(filters: ProductOutputFiltersDto): Promise<OutputSummary['outputs']> {
    const qb = this.createBaseQuery(filters);
    const row = await qb
      .select('COUNT(*)', 'count')
      .addSelect('COALESCE(SUM(o.quantity), 0)', 'totalQuantity')
      .addSelect('COALESCE(SUM(o.subtotal), 0)', 'totalSubtotal')
      .getRawOne<{ count: string | number | null; totalQuantity: string | number | null; totalSubtotal: string | number | null }>();

    return {
      count: this.toNumber(row?.count ?? 0),
      totalQuantity: this.toNumber(row?.totalQuantity ?? 0),
      totalSubtotal: this.toNumber(row?.totalSubtotal ?? 0),
    };
  }

  private async aggregateEntries(filters: ProductOutputFiltersDto): Promise<OutputSummary['entries']> {
    const qb = this.productInputsRepository.createQueryBuilder('i')
      .leftJoin(Product, 'pi_product', 'pi_product.id_product = i.id_product');

    if (filters.startDate) {
      qb.andWhere('i.created_at >= :inputStart', { inputStart: this.buildStartOfDayIso(filters.startDate) });
    }

    if (filters.endDate) {
      qb.andWhere('i.created_at <= :inputEnd', { inputEnd: this.buildEndOfDayIso(filters.endDate) });
    }

    if (filters.productId) {
      qb.andWhere('i.id_product = :productId', { productId: filters.productId });
    }

    if (filters.laboratoryId) {
      qb.andWhere('pi_product.id_brand = :laboratoryId', { laboratoryId: filters.laboratoryId });
    }

    const row = await qb
      .select('COUNT(*)', 'count')
      .addSelect('COALESCE(SUM(i.quantity * i.units_per_box), 0)', 'totalQuantity')
      .addSelect('COALESCE(SUM(i.subtotal), 0)', 'totalSubtotal')
      .getRawOne<{ count: string | number | null; totalQuantity: string | number | null; totalSubtotal: string | number | null }>();

    return {
      count: this.toNumber(row?.count ?? 0),
      totalQuantity: this.toNumber(row?.totalQuantity ?? 0),
      totalSubtotal: this.toNumber(row?.totalSubtotal ?? 0),
    };
  }

  private buildStartOfDayIso(value: string): string {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return value;
    }
    const year = parsed.getUTCFullYear();
    const month = String(parsed.getUTCMonth() + 1).padStart(2, '0');
    const day = String(parsed.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day} 00:00:00`;
  }

  private buildEndOfDayIso(value: string): string {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return value;
    }
    const year = parsed.getUTCFullYear();
    const month = String(parsed.getUTCMonth() + 1).padStart(2, '0');
    const day = String(parsed.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day} 23:59:59.999`;
  }

  private toNumber(value: any): number {
    if (typeof value === 'number') {
      return Number.isNaN(value) ? 0 : value;
    }
    if (typeof value === 'string') {
      const parsed = Number(value);
      return Number.isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  }

  async create(dto: CreateProductOutputDto): Promise<ProductOutput> {
    const subtotal = dto.subtotal ?? dto.quantity * dto.unit_price;

    const newOutput = this.productOutputsRepository.create({
      ...dto,
      subtotal,
    });

    return await this.productOutputsRepository.save(newOutput);
  }

  async findOne(id: number): Promise<ProductOutput | null> {
    return await this.productOutputsRepository.findOneBy({ id_output: id });
  }

  async findBySale(saleId: number): Promise<ProductOutput[]> {
    // Join with products to include the product name for UI display
    const rows = await this.productOutputsRepository.createQueryBuilder('o')
      .leftJoin(Product, 'p', 'p.id_product = o.id_product')
      .leftJoin(Brand, 'b', 'b.id_brand = p.id_brand')
      .leftJoin(ProductType, 'pt', 'pt.id_type = p.id_type')
      .select([
        'o.id_output AS id_output',
        'o.id_sale AS id_sale',
        'o.id_product AS id_product',
        'o.quantity AS quantity',
        'o.unit_price AS unit_price',
        'o.subtotal AS subtotal',
        'o.is_adjustment AS is_adjustment',
        'o.reason AS reason',
        'o.created_at AS created_at',
        'p.name AS product_name',
        'b.name AS brand_name',
        'pt.name AS type_name',
      ])
      .where('o.id_sale = :saleId', { saleId })
      .orderBy('o.created_at', 'ASC')
      .getRawMany();

    // Map raw rows to a friendlier shape (keep property names similar to entity)
    return rows.map(r => ({
      id_output: r.id_output,
      id_sale: r.id_sale,
      id_product: r.id_product,
      quantity: r.quantity,
      unit_price: r.unit_price,
      subtotal: r.subtotal,
      is_adjustment: r.is_adjustment,
      reason: r.reason,
      created_at: r.created_at,
      product_name: r.product_name,
      brand_name: r.brand_name,
      type_name: r.type_name,
    })) as any;
  }

  async update(id: number, dto: UpdateProductOutputDto): Promise<ProductOutput | null> {
    await this.productOutputsRepository.update(id, dto);
    return await this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.productOutputsRepository.delete(id);
  }

  /**
   * Prepare outputs: ensure subtotal is present and calculate total
   */
  async prepareData(outputs: any[]): Promise<{ total: number; outputs: any[] }>{
    let total = 0;
    const out = outputs.map(o => {
      const subtotal = o.subtotal ?? (o.quantity * (o.unit_price ?? o.unitPrice));
      total += Number(subtotal);
      return {
        ...o,
        subtotal
      };
    });
    return { total, outputs: out };
  }

  /**
   * Create many outputs for a sale inside a transaction manager and adjust product stock
   */
  async createManyForSale(saleId: number, outputs: any[], manager: EntityManager): Promise<ProductOutput[]>{
    const repo = manager.getRepository(ProductOutput);
    const productRepo = manager.getRepository(Product);
    const created: ProductOutput[] = [];

    for(const o of outputs){
      const idProduct = o.id_product ?? o.idProduct ?? o.idProduct;
      const unitPrice = o.unit_price ?? o.unitPrice ?? o.unit_price;
      const isAdjustment = o.is_adjustment ?? o.isAdjustment ?? false;

      const toCreate = repo.create({
        id_sale: saleId,
        id_product: idProduct,
        quantity: o.quantity,
        unit_price: unitPrice,
        subtotal: o.subtotal,
        is_adjustment: isAdjustment,
        reason: o.reason,
      });

      const saved = await repo.save(toCreate);
      created.push(saved);

      // NOTE: Stock deduction is handled by a database trigger in production.
      // Do NOT adjust product.stock here to avoid double-decrement when the DB trigger runs.
      // If you need to debug stock changes, inspect DB trigger logs or enable separate audit logs.
    }

    return created;
  }
}

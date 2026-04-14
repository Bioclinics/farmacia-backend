import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, EntityManager } from 'typeorm';
import { ProductOutput } from '../entities/product_output.entity';
import { CreateProductOutputDto } from '../dto/create_product_output.dto';
import { UpdateProductOutputDto } from '../dto/update_product_output.dto';
import { Product } from 'src/modules/products/entities/product.entity';

@Injectable()
export class ProductOutputsService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(ProductOutput)
    private readonly productOutputsRepository: Repository<ProductOutput>,
  ) {}

  async findAllWithFilters(filters: {
    startDate?: string;
    endDate?: string;
    productId?: number;
    laboratoryId?: number;
    userId?: number;
  }): Promise<{
    data: any[];
    summary: {
      period: { startDate: string | null; endDate: string | null };
      outputs: { count: number; totalQuantity: number; totalSubtotal: number };
      entries: { count: number; totalQuantity: number; totalSubtotal: number };
    };
  }> {
    const qb = this.productOutputsRepository.createQueryBuilder('o')
      .leftJoin(Product, 'p', 'p.id_product = o.id_product')
      .leftJoin('sales', 's', 's.id_sale = o.id_sale')
      .leftJoin('users', 'u', 'u.id_user = s.id_user')
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
        'p.stock AS product_stock',
        'p.id_brand AS brand_id',
        'u.id_user AS user_id',
        'u.name AS user_name',
        'u.username AS user_username',
      ])
      .orderBy('o.created_at', 'DESC');

    const applyDateRange = (targetQb: any, dateColumn: string) => {
      if (filters.startDate) {
        targetQb.andWhere(`${dateColumn} >= :startDate`, { startDate: `${filters.startDate} 00:00:00` });
      }
      if (filters.endDate) {
        targetQb.andWhere(`${dateColumn} <= :endDate`, { endDate: `${filters.endDate} 23:59:59.999` });
      }
    };

    applyDateRange(qb, 'o.created_at');

    if (filters.productId) {
      qb.andWhere('o.id_product = :productId', { productId: filters.productId });
    }

    // In frontend this filter is labeled "Laboratorio / Marca" and uses brand ids.
    if (filters.laboratoryId) {
      qb.andWhere('p.id_brand = :brandId', { brandId: filters.laboratoryId });
    }

    if (filters.userId) {
      qb.andWhere('s.id_user = :userId', { userId: filters.userId });
    }

    const rows = await qb.getRawMany();

    const outputsCount = rows.length;
    const outputsTotalQuantity = rows.reduce((acc, row) => acc + Number(row.quantity ?? 0), 0);
    const outputsTotalSubtotal = rows.reduce((acc, row) => acc + Number(row.subtotal ?? 0), 0);

    const entriesParams: any[] = [];
    const entriesWhere: string[] = [];

    if (filters.startDate) {
      entriesParams.push(`${filters.startDate} 00:00:00`);
      entriesWhere.push(`pi.created_at >= $${entriesParams.length}`);
    }
    if (filters.endDate) {
      entriesParams.push(`${filters.endDate} 23:59:59.999`);
      entriesWhere.push(`pi.created_at <= $${entriesParams.length}`);
    }
    if (filters.productId) {
      entriesParams.push(filters.productId);
      entriesWhere.push(`pi.id_product = $${entriesParams.length}`);
    }
    if (filters.laboratoryId) {
      entriesParams.push(filters.laboratoryId);
      entriesWhere.push(`p.id_brand = $${entriesParams.length}`);
    }

    const entriesWhereSql = entriesWhere.length ? `WHERE ${entriesWhere.join(' AND ')}` : '';

    const entriesSummaryRows = await this.dataSource.query(
      `SELECT
          COUNT(*)::int AS count,
          COALESCE(SUM(pi.quantity * pi.units_per_box), 0)::int AS total_quantity,
          COALESCE(SUM(pi.subtotal), 0)::float AS total_subtotal
       FROM products_inputs pi
       INNER JOIN products p ON p.id_product = pi.id_product
       ${entriesWhereSql}`,
      entriesParams,
    );

    const entriesSummary = entriesSummaryRows[0] ?? { count: 0, total_quantity: 0, total_subtotal: 0 };

    return {
      data: rows.map((r) => ({
        id_output: r.id_output,
        id_sale: r.id_sale,
        id_product: r.id_product,
        quantity: r.quantity,
        unit_price: r.unit_price,
        subtotal: r.subtotal,
        is_adjustment: r.is_adjustment,
        reason: r.reason,
        created_at: r.created_at,
        product: {
          id_product: r.product_id,
          name: r.product_name,
          price: r.product_price,
          stock: r.product_stock,
          id_brand: r.brand_id,
        },
        user: r.user_id
          ? {
              id_user: Number(r.user_id),
              name: r.user_name,
              username: r.user_username,
            }
          : null,
      })),
      summary: {
        period: {
          startDate: filters.startDate ?? null,
          endDate: filters.endDate ?? null,
        },
        outputs: {
          count: outputsCount,
          totalQuantity: outputsTotalQuantity,
          totalSubtotal: outputsTotalSubtotal,
        },
        entries: {
          count: Number(entriesSummary.count ?? 0),
          totalQuantity: Number(entriesSummary.total_quantity ?? 0),
          totalSubtotal: Number(entriesSummary.total_subtotal ?? 0),
        },
      },
    };
  }

  async findAll(): Promise<ProductOutput[]> {
    // Join with products to include product info and order by newest first
    const rows = await this.productOutputsRepository.createQueryBuilder('o')
      .leftJoin(Product, 'p', 'p.id_product = o.id_product')
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
        'p.stock AS product_stock',
      ])
      .orderBy('o.created_at', 'DESC')
      .getRawMany();

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
      product: {
        id_product: r.product_id,
        name: r.product_name,
        price: r.product_price,
        stock: r.product_stock,
      }
    })) as any;
  }

  async create(dto: CreateProductOutputDto): Promise<ProductOutput> {
    return await this.dataSource.transaction(async (manager) => {
      const idProduct = Number(dto.id_product);
      const quantity = Number(dto.quantity ?? 0);
      const isAdjustment = Boolean(dto.is_adjustment ?? false);

      if (!Number.isFinite(idProduct) || idProduct <= 0) {
        throw new BadRequestException('Producto invalido para salida');
      }

      if (!Number.isFinite(quantity) || quantity <= 0) {
        throw new BadRequestException('La cantidad debe ser mayor a 0');
      }

      const product = await manager.getRepository(Product).findOne({ where: { id_product: idProduct } });

      if (!product || product.is_deleted) {
        throw new BadRequestException(`Producto ${idProduct} no encontrado`);
      }

      if (!product.is_active) {
        throw new BadRequestException(`El producto ${product.name} esta desactivado`);
      }

      const currentStock = Number(product.stock ?? 0);
      if (!isAdjustment && quantity > currentStock) {
        throw new BadRequestException(
          `Stock insuficiente para ${product.name}. Disponible: ${currentStock}, solicitado: ${quantity}`,
        );
      }

      const subtotal = dto.subtotal ?? quantity * Number(dto.unit_price ?? 0);
      const newOutput = manager.getRepository(ProductOutput).create({
        ...dto,
        subtotal,
      });

      return await manager.getRepository(ProductOutput).save(newOutput);
    });
  }

  async findOne(id: number): Promise<ProductOutput | null> {
    return await this.productOutputsRepository.findOneBy({ id_output: id });
  }

  async findBySale(saleId: number): Promise<ProductOutput[]> {
    // Join with products to include the product name for UI display
    const rows = await this.productOutputsRepository.createQueryBuilder('o')
      .leftJoin(Product, 'p', 'p.id_product = o.id_product')
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
      const idProduct = Number(o.id_product ?? o.idProduct);
      const quantity = Number(o.quantity ?? 0);
      const unitPrice = o.unit_price ?? o.unitPrice ?? o.unit_price;
      const isAdjustment = o.is_adjustment ?? o.isAdjustment ?? false;

      if (!Number.isFinite(idProduct) || idProduct <= 0) {
        throw new BadRequestException('Producto invalido para salida');
      }

      if (!Number.isFinite(quantity) || quantity <= 0) {
        throw new BadRequestException(`Cantidad invalida para producto ${idProduct}`);
      }

      const product = await productRepo.findOne({ where: { id_product: idProduct } });
      if (!product || product.is_deleted) {
        throw new BadRequestException(`Producto ${idProduct} no encontrado`);
      }

      if (!product.is_active) {
        throw new BadRequestException(`El producto ${product.name} esta desactivado`);
      }

      const availableStock = Number(product.stock ?? 0);
      if (!isAdjustment && quantity > availableStock) {
        throw new BadRequestException(
          `Stock insuficiente para ${product.name}. Disponible: ${availableStock}, solicitado: ${quantity}`,
        );
      }

      const subtotal = o.subtotal ?? quantity * Number(unitPrice ?? 0);

      const toCreate = repo.create({
        id_sale: saleId,
        id_product: idProduct,
        quantity,
        unit_price: unitPrice,
        subtotal,
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

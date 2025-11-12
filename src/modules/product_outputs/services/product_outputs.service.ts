import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { ProductOutput } from '../entities/product_output.entity';
import { CreateProductOutputDto } from '../dto/create_product_output.dto';
import { UpdateProductOutputDto } from '../dto/update_product_output.dto';
import { Product } from 'src/modules/products/entities/product.entity';

@Injectable()
export class ProductOutputsService {
  constructor(
    @InjectRepository(ProductOutput)
    private readonly productOutputsRepository: Repository<ProductOutput>,
  ) {}

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

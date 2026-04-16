import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, Repository } from "typeorm";
import { ProductInput } from "../entities/product_input.entity";
import { Product } from 'src/modules/products/entities/product.entity';
import { Laboratory } from 'src/modules/laboratories/entities/laboratory.entity';
import { CreateProductInputDto } from '../dto/create_product_input.dto';
import { UpdateProductInputDto } from '../dto/update_product_input.dto';

@Injectable()
export class ProductInputsService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(ProductInput)
    private readonly productInputsRepository: Repository<ProductInput>
  ) {}

  private getStockUnits(quantity: number, unitsPerBox: number): number {
    return Number(quantity) * Number(unitsPerBox)
  }

  async create(dto: CreateProductInputDto): Promise<ProductInput> {
    return await this.dataSource.transaction(async (manager) => {
      const productRepo = manager.getRepository(Product);
      const inputRepo = manager.getRepository(ProductInput);

      const product = await productRepo.findOne({ where: { id_product: dto.idProduct } });
      if (!product) {
        throw new NotFoundException(`Product #${dto.idProduct} not found`);
      }

      const stockDelta = this.getStockUnits(dto.quantity, dto.unitsPerBox);
      const subtotal = dto.subtotal ?? Number(dto.unitCost ?? 0) * stockDelta;

      const input = inputRepo.create({
        ...dto,
        subtotal,
      });

      const saved = await inputRepo.save(input);
      product.stock = Number(product.stock ?? 0) + stockDelta;
      await productRepo.save(product);

      return saved;
    });
  }

  async findAll(filters: {
    startDate?: string;
    endDate?: string;
    productId?: number;
    laboratoryId?: number;
    isAdjustment?: boolean;
  } = {}): Promise<{
    data: any[];
    summary: {
      period: { startDate: string | null; endDate: string | null };
      entries: { count: number; totalBoxes: number; totalUnits: number; totalSubtotal: number };
      outputs: { count: number; totalQuantity: number; totalSubtotal: number };
    };
  }> {
    // Enrich product inputs with product and laboratory info, ordered newest first
    const qb = this.productInputsRepository.createQueryBuilder('i')
      .leftJoin(Product, 'p', 'p.id_product = i.idProduct')
      .leftJoin(Laboratory, 'l', 'l.id_laboratory = i.idLaboratory')
      .select([
        'i.id AS id_input',
        'i.idProduct AS id_product',
        'i.idLaboratory AS id_laboratory',
        'i.quantity AS quantity',
        'i.unitsPerBox AS units_per_box',
        'i.unitCost AS unit_cost',
        'i.subtotal AS subtotal',
        'i.isAdjustment AS is_adjustment',
        'i.reason AS reason',
        'i.createdAt AS created_at',
        'p.id_product AS product_id',
        'p.name AS product_name',
        'p.price AS product_price',
        'p.stock AS product_stock',
        'l.id_laboratory AS lab_id',
        'l.name AS lab_name',
      ])
      .orderBy('i.createdAt', 'DESC');

    if (filters.startDate) {
      qb.andWhere('i.createdAt >= :startDate', { startDate: `${filters.startDate} 00:00:00` });
    }
    if (filters.endDate) {
      qb.andWhere('i.createdAt <= :endDate', { endDate: `${filters.endDate} 23:59:59.999` });
    }
    if (filters.productId) {
      qb.andWhere('i.idProduct = :productId', { productId: filters.productId });
    }
    if (filters.laboratoryId) {
      qb.andWhere('i.idLaboratory = :laboratoryId', { laboratoryId: filters.laboratoryId });
    }
    if (typeof filters.isAdjustment === 'boolean') {
      qb.andWhere('i.isAdjustment = :isAdjustment', { isAdjustment: filters.isAdjustment });
    }

    const rows = await qb.getRawMany();

    const totalBoxes = rows.reduce((acc, r) => acc + Number(r.quantity ?? 0), 0);
    const totalUnits = rows.reduce((acc, r) => acc + Number(r.quantity ?? 0) * Number(r.units_per_box ?? 1), 0);
    const totalSubtotal = rows.reduce((acc, r) => acc + Number(r.subtotal ?? 0), 0);

    // Build outputs summary using raw query with same filters
    const outputsParams: any[] = [];
    const outputsWhere: string[] = [];
    if (filters.startDate) {
      outputsParams.push(`${filters.startDate} 00:00:00`);
      outputsWhere.push(`po.created_at >= $${outputsParams.length}`);
    }
    if (filters.endDate) {
      outputsParams.push(`${filters.endDate} 23:59:59.999`);
      outputsWhere.push(`po.created_at <= $${outputsParams.length}`);
    }
    if (filters.productId) {
      outputsParams.push(filters.productId);
      outputsWhere.push(`po.id_product = $${outputsParams.length}`);
    }
    if (filters.laboratoryId) {
      outputsParams.push(filters.laboratoryId);
      outputsWhere.push(`p.id_brand = $${outputsParams.length}`);
    }
    const outputsWhereSql = outputsWhere.length ? `WHERE ${outputsWhere.join(' AND ')}` : '';

    const outputsSummaryRows = await this.dataSource.query(
      `SELECT
          COUNT(*)::int AS count,
          COALESCE(SUM(po.quantity), 0)::int AS total_quantity,
          COALESCE(SUM(po.subtotal), 0)::float AS total_subtotal
       FROM product_outputs po
       LEFT JOIN products p ON p.id_product = po.id_product
       ${outputsWhereSql}`,
      outputsParams,
    );
    const outputsSummary = outputsSummaryRows[0] ?? { count: 0, total_quantity: 0, total_subtotal: 0 };

    const data = rows.map(r => ({
      id_input: r.id_input,
      id_product: r.id_product,
      id_laboratory: r.id_laboratory,
      quantity: r.quantity,
      units_per_box: r.units_per_box,
      unitsPerBox: r.units_per_box,
      unit_cost: r.unit_cost,
      subtotal: r.subtotal,
      is_adjustment: r.is_adjustment,
      reason: r.reason,
      created_at: r.created_at,
      product: {
        id_product: r.product_id,
        name: r.product_name,
        price: r.product_price,
        stock: r.product_stock,
      },
      laboratory: {
        id_laboratory: r.lab_id,
        name: r.lab_name,
      }
    }));

    return {
      data,
      summary: {
        period: {
          startDate: filters.startDate ?? null,
          endDate: filters.endDate ?? null,
        },
        entries: {
          count: rows.length,
          totalBoxes,
          totalUnits,
          totalSubtotal,
        },
        outputs: {
          count: Number(outputsSummary.count ?? 0),
          totalQuantity: Number(outputsSummary.total_quantity ?? 0),
          totalSubtotal: Number(outputsSummary.total_subtotal ?? 0),
        },
      },
    };
  }

  async findOne(id: number): Promise<ProductInput> {
    const input = await this.productInputsRepository.findOne({ where: { id } });
    if (!input) throw new NotFoundException(`ProductInput #${id} not found`);
    return input;
  }

  async update(id: number, dto: UpdateProductInputDto): Promise<ProductInput> {
    return await this.dataSource.transaction(async (manager) => {
      const inputRepo = manager.getRepository(ProductInput);
      const productRepo = manager.getRepository(Product);

      const input = await inputRepo.findOne({ where: { id } });
      if (!input) throw new NotFoundException(`ProductInput #${id} not found`);

      const originalStockUnits = this.getStockUnits(input.quantity, input.unitsPerBox);
      const nextQuantity = dto.quantity ?? input.quantity;
      const nextUnitsPerBox = dto.unitsPerBox ?? input.unitsPerBox;
      const nextStockUnits = this.getStockUnits(nextQuantity, nextUnitsPerBox);

      const nextProductId = dto.idProduct ?? input.idProduct;
      const currentProduct = await productRepo.findOne({ where: { id_product: input.idProduct } });
      if (!currentProduct) {
        throw new NotFoundException(`Product #${input.idProduct} not found`);
      }

      if (nextProductId !== input.idProduct) {
        const nextProduct = await productRepo.findOne({ where: { id_product: nextProductId } });
        if (!nextProduct) {
          throw new NotFoundException(`Product #${nextProductId} not found`);
        }

        currentProduct.stock = Number(currentProduct.stock ?? 0) - originalStockUnits;
        nextProduct.stock = Number(nextProduct.stock ?? 0) + nextStockUnits;
        await productRepo.save([currentProduct, nextProduct]);
      } else {
        currentProduct.stock = Number(currentProduct.stock ?? 0) - originalStockUnits + nextStockUnits;
        await productRepo.save(currentProduct);
      }

      const subtotal = dto.subtotal ?? Number(dto.unitCost ?? input.unitCost ?? 0) * nextStockUnits;

      Object.assign(input, dto, {
        subtotal,
        quantity: nextQuantity,
        unitsPerBox: nextUnitsPerBox,
      });

      return await inputRepo.save(input);
    });
  }

  async remove(id: number): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const inputRepo = manager.getRepository(ProductInput);
      const productRepo = manager.getRepository(Product);

      const input = await inputRepo.findOne({ where: { id } });
      if (!input) throw new NotFoundException(`ProductInput #${id} not found`);

      const product = await productRepo.findOne({ where: { id_product: input.idProduct } });
      if (!product) {
        throw new NotFoundException(`Product #${input.idProduct} not found`);
      }

      product.stock = Number(product.stock ?? 0) - this.getStockUnits(input.quantity, input.unitsPerBox);
      await productRepo.save(product);
      await inputRepo.remove(input);
    });
  }
}

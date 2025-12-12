import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, SelectQueryBuilder } from "typeorm";
import { ProductInput } from "../entities/product_input.entity";
import { Product } from 'src/modules/products/entities/product.entity';
import { Laboratory } from 'src/modules/laboratories/entities/laboratory.entity';
import { Brand } from 'src/modules/brands/entities/brand.entity';
import { ProductType } from 'src/modules/product_types/entities/product_type.entity';
import { ProductOutput } from "src/modules/product_outputs/entities/product_output.entity";
import { CreateProductInputDto } from '../dto/create_product_input.dto';
import { UpdateProductInputDto } from '../dto/update_product_input.dto';
import { ProductInputFiltersDto } from '../dto/product-input-filters.dto';

type InputResponsible = {
  type: 'laboratory' | 'adjustment';
  id?: number | null;
  name: string;
};

type InputListItem = {
  id: number;
  productId: number | null;
  laboratoryId: number | null;
  quantityBoxes: number;
  unitsPerBox: number;
  totalUnits: number;
  unitCost: number;
  subtotal: number;
  isAdjustment: boolean;
  reason: string | null;
  createdAt: Date | string;
  product: {
    id: number;
    name: string;
    price?: number;
    brandName?: string;
    typeName?: string;
  } | null;
  laboratory: {
    id: number;
    name: string;
  } | null;
  responsible: InputResponsible | null;
};

type InputSummary = {
  period: {
    startDate: string | null;
    endDate: string | null;
  };
  entries: {
    count: number;
    totalBoxes: number;
    totalUnits: number;
    totalSubtotal: number;
  };
  outputs: {
    count: number;
    totalQuantity: number;
    totalSubtotal: number;
  };
};

@Injectable()
export class ProductInputsService {
  constructor(
    @InjectRepository(ProductInput)
    private readonly productInputsRepository: Repository<ProductInput>,
    @InjectRepository(ProductOutput)
    private readonly productOutputsRepository: Repository<ProductOutput>,
  ) {}

  async create(dto: CreateProductInputDto): Promise<ProductInput> {
    const subtotal = dto.subtotal ?? Number(dto.unitCost ?? 0) * dto.quantity * dto.unitsPerBox;
    const input = this.productInputsRepository.create({
      ...dto,
      subtotal,
    });
    return await this.productInputsRepository.save(input);
  }

  async findAll(filters: ProductInputFiltersDto): Promise<{
    summary: InputSummary;
    data: InputListItem[];
    pagination: { page: number; limit: number; total: number };
  }> {
    const page = filters?.page && filters.page > 0 ? filters.page : 1;
    const limit = filters?.limit && filters.limit > 0 ? filters.limit : 25;
    const skip = (page - 1) * limit;

    const baseQuery = this.createBaseQuery(filters);
    const total = await baseQuery.clone().getCount();

    const rows = await baseQuery
      .select([
        'i.id_input AS id_input',
        'i.id_product AS id_product',
        'i.id_laboratory AS id_laboratory',
        'i.quantity AS quantity',
        'i.units_per_box AS units_per_box',
        'i.unit_cost AS unit_cost',
        'i.subtotal AS subtotal',
        'i.is_adjustment AS is_adjustment',
        'i.reason AS reason',
        'i.created_at AS created_at',
        'p.id_product AS product_id',
        'p.name AS product_name',
        'p.price AS product_price',
        'b.name AS brand_name',
        'pt.name AS type_name',
        'l.id_laboratory AS lab_id',
        'l.name AS lab_name',
      ])
      .orderBy('i.created_at', 'DESC')
      .skip(skip)
      .take(limit)
      .getRawMany();

    const data: InputListItem[] = rows.map((row) => {
      const id = this.toNumber(row.id_input);
      const quantityBoxes = this.toNumber(row.quantity);
      const unitsPerBox = this.toNumber(row.units_per_box || row.unitsPerBox || 0) || 0;
      const totalUnits = quantityBoxes * (unitsPerBox || 1);
      const unitCost = this.toNumber(row.unit_cost);
      const subtotal = this.toNumber(row.subtotal);

      const productId = this.toNumber(row.product_id ?? row.id_product ?? row.idProduct);
      const laboratoryId = this.toNumber(row.lab_id ?? row.id_laboratory ?? row.idLaboratory);

      const product = row.product_name
        ? {
            id: productId,
            name: row.product_name,
            price: this.toNumber(row.product_price),
            brandName: row.brand_name ?? undefined,
            typeName: row.type_name ?? undefined,
          }
        : null;

      const laboratory = row.lab_name
        ? {
            id: laboratoryId,
            name: row.lab_name,
          }
        : null;

      let responsible: InputResponsible | null = null;
      if (Boolean(row.is_adjustment)) {
        responsible = {
          type: 'adjustment',
          name: 'Ajuste de inventario',
        };
      } else if (laboratory) {
        responsible = {
          type: 'laboratory',
          id: laboratory.id,
          name: laboratory.name,
        };
      }

      return {
        id,
        productId: productId || null,
        laboratoryId: laboratoryId || null,
        quantityBoxes,
        unitsPerBox,
        totalUnits,
        unitCost,
        subtotal,
        isAdjustment: Boolean(row.is_adjustment),
        reason: row.reason ?? null,
        createdAt: row.created_at,
        product,
        laboratory,
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

  async findOne(id: number): Promise<ProductInput> {
    const input = await this.productInputsRepository.findOne({ where: { id } });
    if (!input) throw new NotFoundException(`ProductInput #${id} not found`);
    return input;
  }

  async update(id: number, dto: UpdateProductInputDto): Promise<ProductInput> {
    const input = await this.findOne(id);
    Object.assign(input, dto);
    return await this.productInputsRepository.save(input);
  }

  async remove(id: number): Promise<void> {
    const input = await this.findOne(id);
    await this.productInputsRepository.remove(input);
  }

  private createBaseQuery(filters: ProductInputFiltersDto): SelectQueryBuilder<ProductInput> {
    const qb = this.productInputsRepository.createQueryBuilder('i')
      .leftJoin(Product, 'p', 'p.id_product = i.id_product')
      .leftJoin(Brand, 'b', 'b.id_brand = p.id_brand')
      .leftJoin(ProductType, 'pt', 'pt.id_type = p.id_type')
      .leftJoin(Laboratory, 'l', 'l.id_laboratory = i.id_laboratory');

    this.applyFilters(qb, filters);
    return qb;
  }

  private applyFilters(qb: SelectQueryBuilder<ProductInput>, filters: ProductInputFiltersDto) {
    if (filters.startDate) {
      qb.andWhere('i.created_at >= :startDate', { startDate: this.buildStartOfDayIso(filters.startDate) });
    }

    if (filters.endDate) {
      qb.andWhere('i.created_at <= :endDate', { endDate: this.buildEndOfDayIso(filters.endDate) });
    }

    if (filters.productId) {
      qb.andWhere('i.id_product = :productId', { productId: filters.productId });
    }

    if (filters.laboratoryId) {
      qb.andWhere('i.id_laboratory = :laboratoryId', { laboratoryId: filters.laboratoryId });
    }

    if (typeof filters.isAdjustment === 'boolean') {
      qb.andWhere('i.is_adjustment = :isAdjustment', { isAdjustment: filters.isAdjustment });
    }
  }

  private async buildSummary(filters: ProductInputFiltersDto): Promise<InputSummary> {
    const entries = await this.aggregateEntries(filters);
    const outputs = await this.aggregateOutputs(filters);

    return {
      period: {
        startDate: filters.startDate ?? null,
        endDate: filters.endDate ?? null,
      },
      entries,
      outputs,
    };
  }

  private async aggregateEntries(filters: ProductInputFiltersDto): Promise<InputSummary['entries']> {
    const qb = this.productInputsRepository.createQueryBuilder('i');
    this.applyFilters(qb, filters);

    const row = await qb
      .select('COUNT(*)', 'count')
      .addSelect('COALESCE(SUM(i.quantity), 0)', 'totalBoxes')
      .addSelect('COALESCE(SUM(i.quantity * i.units_per_box), 0)', 'totalUnits')
      .addSelect('COALESCE(SUM(i.subtotal), 0)', 'totalSubtotal')
      .getRawOne<{ count: string | number | null; totalBoxes: string | number | null; totalUnits: string | number | null; totalSubtotal: string | number | null }>();

    return {
      count: this.toNumber(row?.count ?? 0),
      totalBoxes: this.toNumber(row?.totalBoxes ?? 0),
      totalUnits: this.toNumber(row?.totalUnits ?? 0),
      totalSubtotal: this.toNumber(row?.totalSubtotal ?? 0),
    };
  }

  private async aggregateOutputs(filters: ProductInputFiltersDto): Promise<InputSummary['outputs']> {
    const qb = this.productOutputsRepository.createQueryBuilder('o')
      .leftJoin(Product, 'p', 'p.id_product = o.id_product');

    if (filters.startDate) {
      qb.andWhere('o.created_at >= :outStart', { outStart: this.buildStartOfDayIso(filters.startDate) });
    }

    if (filters.endDate) {
      qb.andWhere('o.created_at <= :outEnd', { outEnd: this.buildEndOfDayIso(filters.endDate) });
    }

    if (filters.productId) {
      qb.andWhere('o.id_product = :productId', { productId: filters.productId });
    }

    if (filters.laboratoryId) {
      qb.andWhere('p.id_brand = :laboratoryId', { laboratoryId: filters.laboratoryId });
    }

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
}

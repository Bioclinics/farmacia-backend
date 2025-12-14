import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, ILike, In, Repository, SelectQueryBuilder } from 'typeorm';
import { Composition } from '../entities/composition.entity';
import { ProductComposition } from '../entities/product_composition.entity';
import { Product } from 'src/modules/products/entities/product.entity';
import { CreateCompositionDto } from '../dto/create-composition.dto';
import { UpdateCompositionDto } from '../dto/update-composition.dto';
import { AssignProductCompositionsDto, ProductCompositionInputDto, UpdateProductCompositionDto } from '../dto/product-composition.dto';
import { CompositionFiltersDto } from '../dto/composition-filters.dto';
import { ProductOutput } from 'src/modules/product_outputs/entities/product_output.entity';
import { CompositionProductsReportDto } from '../dto/composition-products-report.dto';
import { CompositionSalesReportDto } from '../dto/composition-sales-report.dto';

type CompositionListItem = Composition & { productsCount: number };

@Injectable()
export class CompositionsService {
  constructor(
    @InjectRepository(Composition)
    private readonly compositionsRepository: Repository<Composition>,
    @InjectRepository(ProductComposition)
    private readonly productCompositionsRepository: Repository<ProductComposition>,
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
    @InjectRepository(ProductOutput)
    private readonly productOutputsRepository: Repository<ProductOutput>,
    private readonly dataSource: DataSource,
  ) {}

  async createComposition(dto: CreateCompositionDto): Promise<Composition> {
    const exists = await this.compositionsRepository.findOne({
      where: { name: ILike(dto.name.trim()) },
    });
    if (exists) {
      throw new BadRequestException('Ya existe un principio activo con ese nombre');
    }

    const composition = this.compositionsRepository.create({
      name: dto.name.trim(),
      description: dto.description?.trim() ?? null,
    });

    return this.compositionsRepository.save(composition);
  }

  async updateComposition(id: number, dto: UpdateCompositionDto): Promise<Composition> {
    const composition = await this.compositionsRepository.findOne({ where: { id_composition: id } });
    if (!composition) {
      throw new NotFoundException('Principio activo no encontrado');
    }

    if (dto.name && dto.name.trim().toLowerCase() !== composition.name.toLowerCase()) {
      const exists = await this.compositionsRepository.findOne({ where: { name: ILike(dto.name.trim()) } });
      if (exists) {
        throw new BadRequestException('Ya existe un principio activo con ese nombre');
      }
    }

    composition.name = dto.name?.trim() ?? composition.name;
    composition.description = typeof dto.description === 'undefined' ? composition.description : (dto.description?.trim() ?? null);

    return this.compositionsRepository.save(composition);
  }

  async deleteComposition(id: number): Promise<void> {
    const result = await this.compositionsRepository.delete({ id_composition: id });
    if (!result.affected) {
      throw new NotFoundException('Principio activo no encontrado');
    }
  }

  async findAll(filters: CompositionFiltersDto): Promise<{
    data: CompositionListItem[];
    pagination: { page: number; limit: number; total: number };
  }> {
    const page = filters?.page ?? 1;
    const limit = filters?.limit ?? 10;

    const qb = this.compositionsRepository
      .createQueryBuilder('composition')
      .loadRelationCountAndMap('composition.productsCount', 'composition.productCompositions', 'pc')
      .orderBy('composition.name', 'ASC');

    if (filters?.search && filters.search.trim()) {
      qb.where('LOWER(composition.name) LIKE LOWER(:search)', { search: `%${filters.search.trim()}%` });
    }

    qb.skip((page - 1) * limit).take(limit);

    const [items, total] = await qb.getManyAndCount();

    return {
      data: items.map((item) => ({
        ...item,
        productsCount: Number((item as any).productsCount) || 0,
      })),
      pagination: { page, limit, total },
    };
  }

  async findOne(id: number): Promise<Composition> {
    const composition = await this.compositionsRepository.findOne({ where: { id_composition: id } });
    if (!composition) {
      throw new NotFoundException('Principio activo no encontrado');
    }
    return composition;
  }

  async getProductCompositions(productId: number): Promise<ProductComposition[]> {
    await this.ensureProductExists(productId);

    return this.productCompositionsRepository
      .createQueryBuilder('pc')
      .innerJoinAndSelect('pc.composition', 'composition')
      .where('pc.id_product = :productId', { productId })
      .orderBy('composition.name', 'ASC')
      .getMany();
  }

  async assignCompositions(productId: number, payload: AssignProductCompositionsDto): Promise<ProductComposition[]> {
    if (!payload.items || payload.items.length === 0) {
      throw new BadRequestException('Debe proporcionar al menos un principio activo');
    }

    const normalized = this.normalizeAssignments(payload.items);

    return this.dataSource.transaction(async (manager) => {
      const productRepo = manager.getRepository(Product);
      const productCompositionRepo = manager.getRepository(ProductComposition);
      const compositionRepo = manager.getRepository(Composition);

      const product = await productRepo.findOne({ where: { id_product: productId } });
      if (!product) {
        throw new NotFoundException('Producto no encontrado');
      }

      const compositions = await compositionRepo.find({
        where: { id_composition: In(Array.from(normalized.keys())) },
      });

      if (compositions.length !== normalized.size) {
        const foundIds = new Set(compositions.map((c) => c.id_composition));
        const missing = Array.from(normalized.keys()).filter((id) => !foundIds.has(id));
        throw new NotFoundException(`Principios activos no encontrados: ${missing.join(', ')}`);
      }

      const existing = await productCompositionRepo.find({ where: { id_product: productId } });
      const toSave: ProductComposition[] = [];

      compositions.forEach((composition) => {
        const concentration = normalized.get(composition.id_composition)!;
        const current = existing.find((pc) => pc.id_composition === composition.id_composition);

        if (current) {
          if (current.concentration !== concentration) {
            current.concentration = concentration;
            toSave.push(current);
          }
        } else {
          const entity = productCompositionRepo.create({
            id_product: productId,
            id_composition: composition.id_composition,
            concentration,
          });
          toSave.push(entity);
        }
      });

      if (toSave.length) {
        await productCompositionRepo.save(toSave);
      }

      return productCompositionRepo
        .createQueryBuilder('pc')
        .innerJoinAndSelect('pc.composition', 'composition')
        .where('pc.id_product = :productId', { productId })
        .orderBy('composition.name', 'ASC')
        .getMany();
    });
  }

  async replaceProductCompositions(productId: number, payload: AssignProductCompositionsDto): Promise<ProductComposition[]> {
    const normalized = this.normalizeAssignments(payload.items ?? []);

    return this.dataSource.transaction(async (manager) => {
      const productRepo = manager.getRepository(Product);
      const productCompositionRepo = manager.getRepository(ProductComposition);
      const compositionRepo = manager.getRepository(Composition);

      const product = await productRepo.findOne({ where: { id_product: productId } });
      if (!product) {
        throw new NotFoundException('Producto no encontrado');
      }

      if (normalized.size > 0) {
        const compositions = await compositionRepo.find({
          where: { id_composition: In(Array.from(normalized.keys())) },
        });

        if (compositions.length !== normalized.size) {
          const foundIds = new Set(compositions.map((c) => c.id_composition));
          const missing = Array.from(normalized.keys()).filter((id) => !foundIds.has(id));
          throw new NotFoundException(`Principios activos no encontrados: ${missing.join(', ')}`);
        }

        const existing = await productCompositionRepo.find({ where: { id_product: productId } });
        const toDeleteIds = existing
          .filter((pc) => !normalized.has(pc.id_composition))
          .map((pc) => pc.id_composition);

        if (toDeleteIds.length) {
          await productCompositionRepo.delete({ id_product: productId, id_composition: In(toDeleteIds) });
        }

        const toSave: ProductComposition[] = [];
        compositions.forEach((composition) => {
          const concentration = normalized.get(composition.id_composition)!;
          const current = existing.find((pc) => pc.id_composition === composition.id_composition);
          if (current) {
            if (current.concentration !== concentration) {
              current.concentration = concentration;
              toSave.push(current);
            }
          } else {
            const entity = productCompositionRepo.create({
              id_product: productId,
              id_composition: composition.id_composition,
              concentration,
            });
            toSave.push(entity);
          }
        });

        if (toSave.length) {
          await productCompositionRepo.save(toSave);
        }
      } else {
        await productCompositionRepo.delete({ id_product: productId });
      }

      return productCompositionRepo
        .createQueryBuilder('pc')
        .innerJoinAndSelect('pc.composition', 'composition')
        .where('pc.id_product = :productId', { productId })
        .orderBy('composition.name', 'ASC')
        .getMany();
    });
  }

  async updateProductComposition(
    productId: number,
    compositionId: number,
    dto: UpdateProductCompositionDto,
  ): Promise<ProductComposition> {
    const record = await this.productCompositionsRepository.findOne({
      where: { id_product: productId, id_composition: compositionId },
      relations: ['composition'],
    });
    if (!record) {
      throw new NotFoundException('Relación producto-principio activo no encontrada');
    }

    if (record.concentration === dto.concentration) {
      return record;
    }

    record.concentration = dto.concentration;
    return this.productCompositionsRepository.save(record);
  }

  async getProductComposition(productId: number, compositionId: number): Promise<ProductComposition> {
    const record = await this.productCompositionsRepository.findOne({
      where: { id_product: productId, id_composition: compositionId },
      relations: ['composition'],
    });
    if (!record) {
      throw new NotFoundException('Relación producto-principio activo no encontrada');
    }
    return record;
  }

  async removeProductComposition(productId: number, compositionId: number): Promise<ProductComposition> {
    const record = await this.productCompositionsRepository.findOne({
      where: { id_product: productId, id_composition: compositionId },
      relations: ['composition'],
    });
    if (!record) {
      throw new NotFoundException('Relación producto-principio activo no encontrada');
    }

    await this.productCompositionsRepository.delete({ id_product: productId, id_composition: compositionId });
    return record;
  }

  async findProductsByComposition(compositionId: number) {
    const composition = await this.compositionsRepository.findOne({ where: { id_composition: compositionId } });
    if (!composition) {
      throw new NotFoundException('Principio activo no encontrado');
    }

    return this.buildProductCompositionQuery()
      .where('pc.id_composition = :compositionId', { compositionId })
      .orderBy('product.name', 'ASC')
      .getRawMany();
  }

  async searchProductsByCompositionName(term: string) {
    const qb = this.buildProductCompositionQuery();
    qb.where('LOWER(composition.name) LIKE LOWER(:term)', { term: `%${term.trim()}%` });
    return qb.orderBy('product.name', 'ASC').getRawMany();
  }

  async getProductsReport(filters: CompositionProductsReportDto) {
    const compositions = await this.compositionsRepository.find({
      where: filters?.compositionIds?.length
        ? { id_composition: In(filters.compositionIds) }
        : undefined,
      order: { name: 'ASC' },
    });

    const collection = new Map<
      number,
      {
        id: number;
        name: string;
        description: string | null;
        productsCount: number;
        products: Array<{
          productId: number;
          productName: string;
          concentration: string;
          brandName: string | null;
          typeName: string | null;
          typeId: number | null;
          laboratoryId: number | null;
          laboratoryName: string | null;
          subtypeId: number | null;
          subtypeName: string | null;
          price: number;
          stock: number;
          isActive: boolean;
        }>;
      }
    >();

    compositions.forEach((composition) => {
      collection.set(composition.id_composition, {
        id: composition.id_composition,
        name: composition.name,
        description: composition.description ?? null,
        productsCount: 0,
        products: [],
      });
    });

    const qb = this.productCompositionsRepository
      .createQueryBuilder('pc')
      .innerJoin('pc.product', 'product')
      .innerJoin('pc.composition', 'composition')
      .leftJoin('product.brand', 'brand')
      .leftJoin('product.productType', 'ptype')
      .leftJoin('product.laboratory', 'laboratory')
      .leftJoin('product.subtype', 'subtype')
      .select([
        'pc.id_composition AS composition_id',
        'composition.name AS composition_name',
        'composition.description AS composition_description',
        'product.id_product AS product_id',
        'product.name AS product_name',
        'product.price AS product_price',
        'product.stock AS product_stock',
        'product.is_active AS product_is_active',
        'product.id_type AS type_id',
        'product.id_laboratory AS laboratory_id',
        'product.id_subtype AS subtype_id',
        'brand.name AS brand_name',
        'ptype.name AS type_name',
        'laboratory.name AS laboratory_name',
        'subtype.name AS subtype_name',
        'pc.concentration AS concentration',
      ])
      .where('product.is_deleted = false');

    if (!filters?.includeInactiveProducts) {
      qb.andWhere('product.is_active = true');
    }

    if (filters?.compositionIds && filters.compositionIds.length > 0) {
      qb.andWhere('pc.id_composition IN (:...compositionIds)', { compositionIds: filters.compositionIds });
    }

    if (filters?.laboratoryIds && filters.laboratoryIds.length > 0) {
      qb.andWhere('product.id_laboratory IN (:...laboratoryIds)', { laboratoryIds: filters.laboratoryIds });
    }

    if (filters?.productTypeIds && filters.productTypeIds.length > 0) {
      qb.andWhere('product.id_type IN (:...productTypeIds)', { productTypeIds: filters.productTypeIds });
    }

    if (filters?.productSubtypeIds && filters.productSubtypeIds.length > 0) {
      qb.andWhere('product.id_subtype IN (:...productSubtypeIds)', { productSubtypeIds: filters.productSubtypeIds });
    }

    const rows = await qb
      .orderBy('composition.name', 'ASC')
      .addOrderBy('product.name', 'ASC')
      .getRawMany();

    rows.forEach((row) => {
      const compositionId = Number(row.composition_id);
      if (!compositionId) {
        return;
      }
      if (!collection.has(compositionId)) {
        collection.set(compositionId, {
          id: compositionId,
          name: row.composition_name,
          description: row.composition_description ?? null,
          productsCount: 0,
          products: [],
        });
      }

      const bucket = collection.get(compositionId)!;
      bucket.products.push({
        productId: Number(row.product_id),
        productName: row.product_name,
        concentration: row.concentration,
        brandName: row.brand_name ?? null,
        typeName: row.type_name ?? null,
        typeId: row.type_id ? Number(row.type_id) : null,
        laboratoryId: row.laboratory_id ? Number(row.laboratory_id) : null,
        laboratoryName: row.laboratory_name ?? null,
        subtypeId: row.subtype_id ? Number(row.subtype_id) : null,
        subtypeName: row.subtype_name ?? null,
        price: this.toNumber(row.product_price),
        stock: Number(row.product_stock ?? 0),
        isActive: Boolean(row.product_is_active),
      });
    });

    const result = Array.from(collection.values());
    result.forEach((item) => {
      item.products.sort((a, b) => a.productName.localeCompare(b.productName));
      item.productsCount = item.products.length;
    });

    result.sort((a, b) => a.name.localeCompare(b.name));

    return result;
  }

  async getSalesReport(filters: CompositionSalesReportDto) {
    const baseQuery = this.productOutputsRepository
      .createQueryBuilder('output')
      .innerJoin('sales', 'sale', 'sale.id_sale = output.id_sale')
      .innerJoin(Product, 'product', 'product.id_product = output.id_product')
      .innerJoin(ProductComposition, 'pc', 'pc.id_product = output.id_product')
      .innerJoin(Composition, 'composition', 'composition.id_composition = pc.id_composition')
      .where('output.id_sale IS NOT NULL');

    if (filters?.compositionIds && filters.compositionIds.length > 0) {
      baseQuery.andWhere('composition.id_composition IN (:...compositionIds)', { compositionIds: filters.compositionIds });
    }

    if (!filters?.includeInactiveProducts) {
      baseQuery.andWhere('product.is_deleted = false').andWhere('product.is_active = true');
    } else {
      baseQuery.andWhere('product.is_deleted = false');
    }

    if (filters?.startDate) {
      baseQuery.andWhere('sale.created_at >= :startDate', { startDate: this.normalizeDateBoundary(filters.startDate, false) });
    }

    if (filters?.endDate) {
      baseQuery.andWhere('sale.created_at <= :endDate', { endDate: this.normalizeDateBoundary(filters.endDate, true) });
    }

    const compositionRows = await baseQuery
      .clone()
      .select([
        'composition.id_composition AS compositionId',
        'composition.name AS compositionName',
        'SUM(output.quantity) AS totalQuantity',
        'SUM(output.subtotal) AS totalSales',
        'COUNT(DISTINCT sale.id_sale) AS salesCount',
      ])
      .groupBy('composition.id_composition')
      .addGroupBy('composition.name')
      .orderBy('totalSales', 'DESC')
      .getRawMany();

    if (!compositionRows.length) {
      return [];
    }

    const productRows = await baseQuery
      .clone()
      .select([
        'composition.id_composition AS compositionId',
        'product.id_product AS productId',
        'product.name AS productName',
        'SUM(output.quantity) AS totalQuantity',
        'SUM(output.subtotal) AS totalSales',
      ])
      .groupBy('composition.id_composition')
      .addGroupBy('product.id_product')
      .addGroupBy('product.name')
      .orderBy('composition.id_composition', 'ASC')
      .addOrderBy('totalSales', 'DESC')
      .getRawMany();

    const productsByComposition = new Map<number, Array<{ productId: number; productName: string; totalQuantity: number; totalSales: number }>>();

    productRows.forEach((row) => {
      const compositionId = Number(row.compositionId);
      if (!compositionId) return;
      const bucket = productsByComposition.get(compositionId) ?? [];
      bucket.push({
        productId: Number(row.productId),
        productName: row.productName,
        totalQuantity: Number(row.totalQuantity ?? 0),
        totalSales: this.toNumber(row.totalSales ?? 0),
      });
      productsByComposition.set(compositionId, bucket);
    });

    const result = compositionRows.map((row) => {
      const compositionId = Number(row.compositionId);
      const products = productsByComposition.get(compositionId) ?? [];
      products.sort((a, b) => b.totalSales - a.totalSales);
      return {
        compositionId,
        compositionName: row.compositionName,
        totalQuantity: Number(row.totalQuantity ?? 0),
        totalSales: this.toNumber(row.totalSales ?? 0),
        salesCount: Number(row.salesCount ?? 0),
        products,
      };
    });

    result.sort((a, b) => b.totalSales - a.totalSales);
    return result;
  }

  async getCombinedProductsReport(filters?: CompositionProductsReportDto) {
    const includeInactive = Boolean(filters?.includeInactiveProducts);
    const filterCompositionIds = filters?.compositionIds && filters.compositionIds.length > 0 ? new Set(filters.compositionIds) : null;

    const qb = this.productsRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.brand', 'brand')
      .leftJoinAndSelect('product.productType', 'ptype')
      .leftJoinAndSelect('product.laboratory', 'laboratory')
      .leftJoinAndSelect('product.subtype', 'subtype')
      .leftJoinAndSelect('product.productCompositions', 'pc')
      .leftJoinAndSelect('pc.composition', 'composition')
      .where('product.is_deleted = false')
      .andWhere(
        `(
          SELECT COUNT(*) FROM product_compositions pc_count
          WHERE pc_count.id_product = product.id_product
        ) > 1`,
      )
      .orderBy('product.name', 'ASC');

    if (filters?.productTypeIds && filters.productTypeIds.length > 0) {
      qb.andWhere('product.id_type IN (:...productTypeIds)', { productTypeIds: filters.productTypeIds });
    }

    if (filters?.productSubtypeIds && filters.productSubtypeIds.length > 0) {
      qb.andWhere('product.id_subtype IN (:...productSubtypeIds)', { productSubtypeIds: filters.productSubtypeIds });
    }

    if (filters?.laboratoryIds && filters.laboratoryIds.length > 0) {
      qb.andWhere('product.id_laboratory IN (:...laboratoryIds)', { laboratoryIds: filters.laboratoryIds });
    }

    const products = await qb.getMany();

    let filtered = includeInactive ? products : products.filter((product) => product.is_active);

    if (filterCompositionIds) {
      filtered = filtered.filter((product) =>
        (product.productCompositions ?? []).some((pc) => filterCompositionIds.has(pc.id_composition)),
      );
    }

    return filtered.map((product) => ({
      productId: product.id_product,
      name: product.name,
      price: this.toNumber(product.price),
      stock: Number(product.stock ?? 0),
      isActive: Boolean(product.is_active),
      brand: product.brand
        ? {
            id: (product.brand as any).id_brand ?? product.brand.id_brand,
            name: product.brand.name,
          }
        : null,
      type: product.productType
        ? {
            id: (product.productType as any).id_type ?? product.productType.id_type,
            name: product.productType.name,
          }
        : null,
      laboratory: product.laboratory
        ? {
            id: (product.laboratory as any).id ?? product.laboratory.id,
            name: product.laboratory.name,
          }
        : null,
      subtype: product.subtype
        ? {
            id: (product.subtype as any).id_subtype ?? product.subtype.id_subtype,
            name: product.subtype.name,
          }
        : null,
      compositions: (product.productCompositions ?? []).map((pc) => ({
        id: pc.id_composition,
        name: pc.composition?.name ?? '',
        concentration: pc.concentration,
      })),
    }));
  }

  private buildProductCompositionQuery(): SelectQueryBuilder<ProductComposition> {
    return this.productCompositionsRepository
      .createQueryBuilder('pc')
      .innerJoin(Product, 'product', 'product.id_product = pc.id_product')
      .innerJoin(Composition, 'composition', 'composition.id_composition = pc.id_composition')
      .select([
        'product.id_product AS product_id',
        'product.name AS product_name',
        'product.price AS product_price',
        'product.stock AS product_stock',
        'pc.concentration AS concentration',
        'composition.id_composition AS composition_id',
        'composition.name AS composition_name',
      ]);
  }

  private normalizeDateBoundary(value: string, endOfDay: boolean): string {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return value;
    }
    const copy = new Date(parsed.getTime());
    if (endOfDay) {
      copy.setHours(23, 59, 59, 999);
    } else {
      copy.setHours(0, 0, 0, 0);
    }
    const year = copy.getFullYear();
    const month = String(copy.getMonth() + 1).padStart(2, '0');
    const day = String(copy.getDate()).padStart(2, '0');
    const hours = String(copy.getHours()).padStart(2, '0');
    const minutes = String(copy.getMinutes()).padStart(2, '0');
    const seconds = String(copy.getSeconds()).padStart(2, '0');
    const milliseconds = String(copy.getMilliseconds()).padStart(3, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${milliseconds}`;
  }

  private toNumber(value: any): number {
    if (typeof value === 'number') {
      return value;
    }
    if (typeof value === 'string') {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : 0;
    }
    return 0;
  }

  private normalizeAssignments(assignments: ProductCompositionInputDto[]): Map<number, string> {
    const map = new Map<number, string>();
    (assignments ?? []).forEach((item) => {
      const concentration = item.concentration?.trim();
      if (!concentration) {
        throw new BadRequestException('La concentración es requerida');
      }
      map.set(Number(item.idComposition), concentration);
    });
    return map;
  }

  private async ensureProductExists(productId: number): Promise<void> {
    const exists = await this.productsRepository.findOne({ where: { id_product: productId } });
    if (!exists) {
      throw new NotFoundException('Producto no encontrado');
    }
  }
}

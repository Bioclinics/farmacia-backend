import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CompositionsService } from 'src/modules/compositions/services/compositions.service';
import { Product } from '../entities/product.entity';
import { CreateProductCompositionItemDto, CreateProductDto } from '../dto/create_product.dto';
import { ProductsFilterDto } from '../dto/products-filter.dto';
import { UpdateProductDto } from '../dto/update_product.dto';
import { ProductType } from 'src/modules/product_types/entities/product_type.entity';
import { ProductSubtype } from 'src/modules/product_types/entities/product_subtype.entity';
import { Laboratory } from 'src/modules/laboratories/entities/laboratory.entity';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly repo: Repository<Product>,
    @InjectRepository(ProductType)
    private readonly productTypesRepo: Repository<ProductType>,
    @InjectRepository(ProductSubtype)
    private readonly productSubtypesRepo: Repository<ProductSubtype>,
    @InjectRepository(Laboratory)
    private readonly laboratoriesRepo: Repository<Laboratory>,
    private readonly compositionsService: CompositionsService,
  ) {}

  private sortCompositions(product?: Product | null) {
    if (!product?.productCompositions?.length) {
      return;
    }
    product.productCompositions = [...product.productCompositions].sort((a, b) => {
      const nameA = a.composition?.name?.toLowerCase() ?? '';
      const nameB = b.composition?.name?.toLowerCase() ?? '';
      return nameA.localeCompare(nameB);
    });
  }

  private normalizeCompositionAssignments(items?: CreateProductCompositionItemDto[]): Array<{ idComposition: number; concentration: string }> {
    if (!Array.isArray(items)) {
      return [];
    }
    const assignments = new Map<number, string>();
    for (const item of items) {
      if (!item) continue;
      const rawId = (item as any).idComposition ?? (item as any).id_composition;
      const id = Number(rawId);
      if (!Number.isInteger(id) || id <= 0) {
        continue;
      }
      const rawConcentration = (item.concentration ?? '').toString().trim();
      const concentration = rawConcentration.length ? rawConcentration.slice(0, 50) : 'Sin especificar';
      assignments.set(id, concentration);
    }
    return Array.from(assignments.entries()).map(([idComposition, concentration]) => ({ idComposition, concentration }));
  }

  private async loadDetailedProducts(ids: number[]): Promise<Product[]> {
    if (!ids.length) {
      return [];
    }

    const products = await this.repo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.productType', 'productType')
      .leftJoinAndSelect('p.brand', 'brand')
      .leftJoinAndSelect('p.laboratory', 'laboratory')
      .leftJoinAndSelect('p.subtype', 'subtype')
      .leftJoinAndSelect('p.productCompositions', 'productCompositions')
      .leftJoinAndSelect('productCompositions.composition', 'composition')
      .where('p.id_product IN (:...ids)', { ids })
      .andWhere('p.is_deleted = false')
      .orderBy('p.name', 'ASC')
      .addOrderBy('composition.name', 'ASC')
      .getMany();

    const ordered = new Map<number, Product>();
    products.forEach((product) => {
      this.sortCompositions(product);
      (product as any).compositionsCount = product.productCompositions?.length ?? 0;
      ordered.set(product.id_product, product);
    });

    return ids
      .map((id) => ordered.get(id))
      .filter((product): product is Product => Boolean(product));
  }

  /**
   * Find all products with pagination and filters.
   * Returns { data, total, page, limit }
   */
  async findAll(params: ProductsFilterDto): Promise<{ data: Product[]; total: number; page: number; limit: number; pages: number }> {
    const page = params.page ?? 1;
    const limit = params.limit ?? 10;

    const qb = this.repo
      .createQueryBuilder('p')
      .where('p.is_deleted = false')
      .orderBy('p.name', 'ASC');

    if (params.name) {
      qb.andWhere('p.name ILIKE :name', { name: `%${params.name}%` });
    }

    if (params.type !== undefined) {
      qb.andWhere('p.id_type = :type', { type: params.type });
    }

    if (params.brand !== undefined) {
      qb.andWhere('p.id_brand = :brand', { brand: params.brand });
    }

    if (params.laboratory !== undefined) {
      qb.andWhere('p.id_laboratory = :laboratory', { laboratory: params.laboratory });
    }

    if (params.subtype !== undefined) {
      qb.andWhere('p.id_subtype = :subtype', { subtype: params.subtype });
    }

    if (params.isActive !== undefined) {
      qb.andWhere('p.is_active = :isActive', { isActive: params.isActive });
    }

    if (params.compositionIds && params.compositionIds.length > 0) {
      qb.andWhere(
        `EXISTS (
          SELECT 1 FROM product_compositions pc_filter
          WHERE pc_filter.id_product = p.id_product
          AND pc_filter.id_composition IN (:...compositionIds)
        )`,
        { compositionIds: params.compositionIds },
      );
    }

    if (params.concentration && params.concentration.trim()) {
      qb.andWhere(
        `EXISTS (
          SELECT 1 FROM product_compositions pc_conc
          WHERE pc_conc.id_product = p.id_product
          AND pc_conc.concentration ILIKE :concentration
        )`,
        { concentration: `%${params.concentration.trim()}%` },
      );
    }

    if (typeof params.isCombined === 'boolean') {
      if (params.isCombined) {
        qb.andWhere(
          `(
            SELECT COUNT(*) FROM product_compositions pc_comb
            WHERE pc_comb.id_product = p.id_product
          ) > 1`,
        );
      } else {
        qb.andWhere(
          `(
            SELECT COUNT(*) FROM product_compositions pc_single
            WHERE pc_single.id_product = p.id_product
          ) <= 1`,
        );
      }
    }

    if (limit > 0) {
      qb.skip((page - 1) * limit).take(limit);
    }

    const [rows, total] = await qb.getManyAndCount();
    const ids = rows.map((row) => row.id_product);
    const data = await this.loadDetailedProducts(ids);
    const pages = limit > 0 ? Math.ceil(total / limit) : 1;

    return { data, total, page, limit, pages };
  }

  async findOne(id: number): Promise<Product> {
    const [product] = await this.loadDetailedProducts([id]);
    if (!product) {
      throw new NotFoundException(`Producto con id ${id} no encontrado`);
    }
    return product;
  }

  async create(dto: CreateProductDto): Promise<Product> {
    const assignments = this.normalizeCompositionAssignments(dto.compositions);
    const productType = await this.ensureProductType(dto.idType);
    const laboratory = await this.ensureLaboratory(dto.idLaboratory);

    let subtypeId: number | null = null;
    const requiresSubtype = await this.typeRequiresSubtype(productType.id_type);
    if (requiresSubtype) {
      if (!dto.idSubtype) {
        throw new BadRequestException('El tipo de producto seleccionado requiere un subtipo.');
      }
      const subtype = await this.ensureSubtype(dto.idSubtype, productType.id_type);
      subtypeId = subtype.id_subtype;
    } else if (dto.idSubtype) {
      const subtype = await this.ensureSubtype(dto.idSubtype, productType.id_type);
      subtypeId = subtype.id_subtype;
    }

    const newProduct = this.repo.create({
      name: dto.name,
      price: dto.price,
      stock: dto.stock ?? 0,
      min_stock: dto.minStock ?? 0,
      id_type: productType.id_type,
      id_brand: dto.idBrand,
      id_laboratory: laboratory.id,
      id_subtype: subtypeId,
      is_active: dto.isActive ?? true,
    });

    const saved = await this.repo.save(newProduct);

    if (assignments.length) {
      await this.compositionsService.replaceProductCompositions(saved.id_product, { items: assignments });
    }

    return this.findOne(saved.id_product);
  }

  async update(id: number, dto: UpdateProductDto): Promise<Product> {
    const product = await this.repo.findOne({ where: { id_product: id, is_deleted: false } });
    if (!product) {
      throw new NotFoundException(`Producto con id ${id} no encontrado`);
    }

    const targetTypeId = dto.idType ?? product.id_type;
    const productType = await this.ensureProductType(targetTypeId);

    const laboratoryId = dto.idLaboratory ?? product.id_laboratory;
    if (!laboratoryId) {
      throw new BadRequestException('El laboratorio del producto es obligatorio.');
    }
    const laboratory = await this.ensureLaboratory(laboratoryId);

    let subtypeId: number | null = product.id_subtype ?? null;
    const requiresSubtype = await this.typeRequiresSubtype(productType.id_type);
    if (requiresSubtype) {
      const candidateSubtypeId = dto.idSubtype ?? subtypeId;
      if (!candidateSubtypeId) {
        throw new BadRequestException('El tipo de producto seleccionado requiere un subtipo.');
      }
      const subtype = await this.ensureSubtype(candidateSubtypeId, productType.id_type);
      subtypeId = subtype.id_subtype;
    } else {
      if (dto.idSubtype !== undefined) {
        if (dto.idSubtype === null) {
          subtypeId = null;
        } else {
          const subtype = await this.ensureSubtype(dto.idSubtype, productType.id_type);
          subtypeId = subtype.id_subtype;
        }
      } else if (dto.idType !== undefined) {
        // Si el tipo cambia a uno sin subtipos, limpiamos el subtipo previo
        subtypeId = null;
      }
    }

    if (dto.name !== undefined) product.name = dto.name;
    if (dto.price !== undefined) product.price = dto.price;
    if (dto.stock !== undefined) product.stock = dto.stock;
    if (dto.minStock !== undefined) product.min_stock = dto.minStock;
    if (dto.isActive !== undefined) product.is_active = dto.isActive;
    if (dto.idBrand !== undefined) product.id_brand = dto.idBrand;

    product.id_type = productType.id_type;
    product.id_laboratory = laboratory.id;
    product.id_subtype = subtypeId;
    product.updated_at = new Date();

    await this.repo.save(product);

    if (Object.prototype.hasOwnProperty.call(dto, 'compositions')) {
      const assignments = this.normalizeCompositionAssignments(dto.compositions);
      await this.compositionsService.replaceProductCompositions(id, { items: assignments });
    }

    return this.findOne(id);
  }

  async remove(id: number) {
    const result = await this.repo.update({ id_product: id, is_deleted: false }, { is_deleted: true, updated_at: new Date() });
    if (!result.affected) {
      throw new NotFoundException(`Producto con id ${id} no encontrado`);
    }
    return { message: 'Producto eliminado correctamente' };
  }

  async setActive(id: number, active: boolean): Promise<Product> {
    const result = await this.repo.update({ id_product: id, is_deleted: false }, { is_active: active, updated_at: new Date() });
    if (!result.affected) {
      throw new NotFoundException(`Producto con id ${id} no encontrado`);
    }
    return this.findOne(id);
  }

  private async ensureProductType(id: number): Promise<ProductType> {
    const type = await this.productTypesRepo.findOne({ where: { id_type: id, is_deleted: false } });
    if (!type) {
      throw new NotFoundException('Tipo de producto no encontrado');
    }
    return type;
  }

  private async ensureLaboratory(id: number): Promise<Laboratory> {
    const laboratory = await this.laboratoriesRepo.findOne({ where: { id, isDeleted: false, isActive: true } });
    if (!laboratory) {
      throw new NotFoundException('Laboratorio no encontrado');
    }
    return laboratory;
  }

  private async ensureSubtype(id: number, typeId: number): Promise<ProductSubtype> {
    const subtype = await this.productSubtypesRepo.findOne({ where: { id_subtype: id, id_type: typeId, is_deleted: false, is_active: true } });
    if (!subtype) {
      throw new NotFoundException('Subtipo de producto no válido para el tipo seleccionado');
    }
    return subtype;
  }

  private async typeRequiresSubtype(typeId: number): Promise<boolean> {
    const count = await this.productSubtypesRepo.count({ where: { id_type: typeId, is_deleted: false, is_active: true } });
    return count > 0;
  }
}

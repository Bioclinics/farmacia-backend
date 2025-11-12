import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../entities/product.entity';
import { CreateProductDto } from '../dto/create_product.dto';
import { UpdateProductDto } from '../dto/update_product.dto';
import { ProductsFilterDto } from '../dto/products-filter.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly repo: Repository<Product>,
  ) {}

  /**
   * Find all products with pagination and filters.
   * Returns { data, total, page, limit }
   */
  async findAll(params: ProductsFilterDto): Promise<{ data: Product[]; total: number; page: number; limit: number; pages: number }> {
    const page = params.page ?? 1;
    const limit = params.limit ?? 10;

    const qb = this.repo.createQueryBuilder('p')
      .leftJoinAndSelect('p.productType', 'productType')
      .where('p.is_deleted = false');

    if (params.name) {
      qb.andWhere('p.name ILIKE :name', { name: `%${params.name}%` });
    }

    if (params.type !== undefined) {
      qb.andWhere('p.id_type = :type', { type: params.type });
    }

    if (params.isActive !== undefined) {
      qb.andWhere('p.is_active = :isActive', { isActive: params.isActive });
    }

    qb.orderBy('p.name', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();
    const pages = Math.ceil(total / limit);
    return { data, total, page, limit, pages };
  }

  async findOne(id: number): Promise<Product> {
    const product = await this.repo.findOne({
      where: { id_product: id, is_deleted: false },
      relations: ['productType'],
    });
    if (!product) throw new NotFoundException(`Producto con id ${id} no encontrado`);
    return product;
  }

  async create(dto: CreateProductDto): Promise<Product> {
    const newProduct = this.repo.create({
      ...dto,
      id_type: dto.idType,
      is_active: dto.isActive ?? true,
      stock: dto.stock ?? 0,
      min_stock: dto.minStock ?? 0,
    });
    return this.repo.save(newProduct);
  }

  async update(id: number, dto: UpdateProductDto): Promise<Product> {
    const product = await this.findOne(id);
    if (dto.idType !== undefined) product.id_type = dto.idType;
    if (dto.name !== undefined) product.name = dto.name;
    if (dto.price !== undefined) product.price = dto.price;
    if (dto.stock !== undefined) product.stock = dto.stock;
    if (dto.minStock !== undefined) product.min_stock = dto.minStock;
    if (dto.isActive !== undefined) product.is_active = dto.isActive;

    product.updated_at = new Date();
    return this.repo.save(product);
  }

  async remove(id: number) {
    const product = await this.findOne(id);
    product.is_deleted = true;
    await this.repo.save(product);
    return { message: 'Producto eliminado correctamente' };
  }

  async setActive(id: number, active: boolean): Promise<Product> {
    const product = await this.findOne(id);
    product.is_active = active;
    product.updated_at = new Date();
    return this.repo.save(product);
  }
}

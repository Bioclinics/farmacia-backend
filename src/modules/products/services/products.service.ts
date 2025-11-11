import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { Product } from '../entities/product.entity';
import { CreateProductDto } from '../dto/create_product.dto';
import { UpdateProductDto } from '../dto/update_product.dto';

interface FindAllParams {
  name?: string;
  type?: number;
  isActive?: boolean;
}

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly repo: Repository<Product>,
  ) {}

  async findAll(params: FindAllParams): Promise<Product[]> {
    const where: any = { is_deleted: false };

    if (params.name) {
      where.name = ILike(`%${params.name}%`);
    }

    if (params.type !== undefined) {
      where.id_type = params.type;
    }

    if (params.isActive !== undefined) {
      where.is_active = params.isActive;
    }

    return this.repo.find({
      where,
      relations: ['productType'],
      order: { name: 'ASC' },
    });
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
}

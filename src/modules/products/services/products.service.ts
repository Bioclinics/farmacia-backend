import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../entities/product.entity';
import { CreateProductDto } from '../dto/create_product.dto';
import { UpdateProductDto } from '../dto/update_product.dto';
import { ProductType } from '../../product_types/entities/product_type.entity';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
  ) {}

  async findAll(): Promise<Product[]> {
    return this.productRepo.find({
      where: { is_deleted: false },
      relations: ['productType'], 
    });
  }

  async findOne(id: number): Promise<Product> {
    const product = await this.productRepo.findOne({
      where: { id_product: id, is_deleted: false },
      relations: ['productType'],
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return product;
  }

  async create(dto: CreateProductDto): Promise<Product> {
    const newProduct = this.productRepo.create({
      name: dto.name,
      id_type: dto.idType,
      price: dto.price,
      min_stock: dto.minStock ?? 0,
      stock: dto.stock ?? 0,
      is_active: dto.isActive ?? true,
    } as Partial<Product>);

    return this.productRepo.save(newProduct);
  }

  async update(id: number, changes: UpdateProductDto): Promise<Product> {
    const product = await this.findOne(id);

    // Adaptamos los nombres camelCase del DTO a snake_case de la entidad
    const updatedFields: Partial<Product> = {
      ...(changes.name && { name: changes.name }),
      ...(changes.idType && { id_type: changes.idType }),
      ...(changes.price && { price: changes.price }),
      ...(changes.minStock !== undefined && { min_stock: changes.minStock }),
      ...(changes.stock !== undefined && { stock: changes.stock }),
      ...(changes.isActive !== undefined && { is_active: changes.isActive }),
    };

    this.productRepo.merge(product, updatedFields);
    return this.productRepo.save(product);
  }

  async remove(id: number): Promise<Product> {
    const product = await this.findOne(id);
    product.is_deleted = true;
    return this.productRepo.save(product);
  }
}

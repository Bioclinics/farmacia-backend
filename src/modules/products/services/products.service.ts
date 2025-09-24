import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Product } from "../entities/product.entity";
import { CreateProductDto } from "../dto/create_product.dto";
import { UpdateProductDto } from "../dto/update_product.dto";

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
  ) {}

  async findAll(): Promise<Product[]> {
    return this.productRepo.find({
      where: { isDeleted: false },
      relations: ["type"],
    });
  }

  async findOne(id: number): Promise<Product> {
    const product = await this.productRepo.findOne({
      where: { id, isDeleted: false },
      relations: ["type"],
    });
    if (!product) {
      throw new NotFoundException(`Product with id ${id} not found`);
    }
    return product;
  }

  async create(data: CreateProductDto): Promise<Product> {
    const newProduct = this.productRepo.create({
      ...data,
      type: { id: data.idType } as any,
    });
    return this.productRepo.save(newProduct);
  }

  async update(id: number, changes: UpdateProductDto): Promise<Product> {
    const product = await this.findOne(id);

    if (changes.idType) {
      product.type = { id: changes.idType } as any;
      delete changes.idType;
    }

    this.productRepo.merge(product, changes);
    return this.productRepo.save(product);
  }

  async remove(id: number) {
    const product = await this.findOne(id);
    product.isDeleted = true; // soft delete
    return this.productRepo.save(product);
  }
}

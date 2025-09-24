import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ProductType } from "../entities/product_type.entity";
import { CreateProductTypeDto } from "../dto/create_product_type.dto";

@Injectable()
export class ProductTypesService {
  constructor(
    @InjectRepository(ProductType)
    private readonly productTypesRepository: Repository<ProductType>
  ) {}

  async findAll(): Promise<ProductType[]> {
    return this.productTypesRepository.find({ where: { isDeleted: false } });
  }

  async findOne(id: number): Promise<ProductType> {
    const type = await this.productTypesRepository.findOneBy({ id });
    if (!type) throw new NotFoundException(`Product type with ID ${id} not found`);
    return type;
  }

  async create(dto: CreateProductTypeDto): Promise<ProductType> {
    const type = this.productTypesRepository.create(dto);
    return this.productTypesRepository.save(type);
  }

  async update(id: number, dto: CreateProductTypeDto): Promise<ProductType> {
    const type = await this.findOne(id); // valida que exista
    Object.assign(type, dto); // actualiza los campos
    return this.productTypesRepository.save(type);
  }

  async remove(id: number): Promise<void> {
    const type = await this.findOne(id); // valida que exista
    type.isDeleted = true;
    await this.productTypesRepository.save(type);
  }
}

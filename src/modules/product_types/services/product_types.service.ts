import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ProductType } from "../entities/product_type.entity";
import { CreateProductTypeDto, UpdateProductTypeDto } from "../dto/create_product_type.dto";

@Injectable()
export class ProductTypesService {
  constructor(
    @InjectRepository(ProductType)
    private readonly productTypesRepository: Repository<ProductType>,
  ) {}

  findAll() {
    return this.productTypesRepository.find({ where: { is_deleted: false } });
  }

  async findOne(id: number) {
    const type = await this.productTypesRepository.findOneBy({ id_type: id });
    if (!type) throw new NotFoundException(`ProductType ${id} not found`);
    return type;
  }

  create(dto: CreateProductTypeDto) {
    const type = this.productTypesRepository.create(dto);
    return this.productTypesRepository.save(type);
  }

  async update(id: number, dto: UpdateProductTypeDto) {
    const type = await this.findOne(id);
    Object.assign(type, dto, { updated_at: new Date() });
    return this.productTypesRepository.save(type);
  }

  async remove(id: number) {
    const type = await this.findOne(id);
    type.is_deleted = true;
    return this.productTypesRepository.save(type);
  }
}

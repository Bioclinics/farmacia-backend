import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { ILike, Repository } from "typeorm";
import { ProductType } from "../entities/product_type.entity";
import { CreateProductTypeDto, UpdateProductTypeDto } from "../dto/create_product_type.dto";

@Injectable()
export class ProductTypesService {
  constructor(
    @InjectRepository(ProductType)
    private readonly repo: Repository<ProductType>,
  ) {}

  // ✅ Listar y filtrar por nombre
  async findAll(name?: string): Promise<ProductType[]> {
    const where = {
      is_deleted: false,
      ...(name ? { name: ILike(`%${name}%`) } : {}), // <-- Filtro parcial por coincidencia
    };

    return this.repo.find({
      where,
      order: { name: "ASC" }, // <-- Orden alfabético por nombre
    });
  }

  async findOne(id: number): Promise<ProductType> {
    const productType = await this.repo.findOne({ where: { id_type: id, is_deleted: false } });
    if (!productType) {
      throw new NotFoundException(`Tipo de producto con id ${id} no encontrado`);
    }
    return productType;
  }

  async create(dto: CreateProductTypeDto): Promise<ProductType> {
    const newType = this.repo.create(dto);
    return await this.repo.save(newType);
  }

  async update(id: number, dto: UpdateProductTypeDto): Promise<ProductType> {
    const productType = await this.findOne(id);
    Object.assign(productType, dto);
    productType.updated_at = new Date();
    return await this.repo.save(productType);
  }

  async remove(id: number) {
    const productType = await this.findOne(id);
    productType.is_deleted = true;
    await this.repo.save(productType);
    return { message: "Tipo de producto eliminado correctamente" };
  }
}

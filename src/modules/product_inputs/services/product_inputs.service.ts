import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ProductInput } from "../entities/product_input.entity";
import { CreateProductInputDto } from '../dto/create_product_input.dto';
import { UpdateProductInputDto } from '../dto/update_product_input.dto';

@Injectable()
export class ProductInputsService {
  constructor(
    @InjectRepository(ProductInput)
    private readonly productInputsRepository: Repository<ProductInput>
  ) {}

  async create(dto: CreateProductInputDto): Promise<ProductInput> {
    const input = this.productInputsRepository.create(dto);
    return await this.productInputsRepository.save(input);
  }

  async findAll(): Promise<ProductInput[]> {
    return await this.productInputsRepository.find();
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
}

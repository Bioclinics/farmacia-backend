import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ProductOutput } from "../entities/product_output.entity";
import { CreateProductOutputDto } from "../dto/create_product_output.dto";
import { UpdateProductOutputDto } from "../dto/update_product_output.dto";

@Injectable()
export class ProductOutputsService {
  constructor(
    @InjectRepository(ProductOutput)
    private readonly productOutputsRepository: Repository<ProductOutput>,
  ) {}

  async create(dto: CreateProductOutputDto): Promise<ProductOutput> {
    const subtotal = dto.quantity * dto.unitPrice;
    const output = this.productOutputsRepository.create({
      ...dto,
      subtotal,
    });
    return await this.productOutputsRepository.save(output);
  }

  async findAll(): Promise<ProductOutput[]> {
    return await this.productOutputsRepository.find();
  }

  async findOne(id: number): Promise<ProductOutput> {
    const output = await this.productOutputsRepository.findOne({ where: { id } });
    if (!output) throw new NotFoundException(`ProductOutput #${id} not found`);
    return output;
  }

  async update(id: number, dto: UpdateProductOutputDto): Promise<ProductOutput> {
    const output = await this.findOne(id);
    Object.assign(output, dto);
    output.subtotal = output.quantity * output.unitPrice;
    return await this.productOutputsRepository.save(output);
  }

  async remove(id: number): Promise<void> {
    const output = await this.findOne(id);
    await this.productOutputsRepository.remove(output);
  }
}

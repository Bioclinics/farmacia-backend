import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductOutput } from '../entities/product_output.entity';
import { CreateProductOutputDto } from '../dto/create_product_output.dto';
import { UpdateProductOutputDto } from '../dto/update_product_output.dto';

@Injectable()
export class ProductOutputsService {
  constructor(
    @InjectRepository(ProductOutput)
    private readonly productOutputsRepository: Repository<ProductOutput>,
  ) {}

  async findAll(): Promise<ProductOutput[]> {
    return await this.productOutputsRepository.find();
  }

  async create(dto: CreateProductOutputDto): Promise<ProductOutput> {
    const subtotal = dto.subtotal ?? dto.quantity * dto.unit_price;

    const newOutput = this.productOutputsRepository.create({
      ...dto,
      subtotal,
    });

    return await this.productOutputsRepository.save(newOutput);
  }

  async findOne(id: number): Promise<ProductOutput | null> {
    return await this.productOutputsRepository.findOneBy({ id_output: id });
  }

  async update(id: number, dto: UpdateProductOutputDto): Promise<ProductOutput | null> {
    await this.productOutputsRepository.update(id, dto);
    return await this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.productOutputsRepository.delete(id);
  }
}

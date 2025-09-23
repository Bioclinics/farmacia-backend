import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductType } from '../entities/product_type.entity';

@Injectable()
export class ProductTypesService {
    constructor(
        @InjectRepository(ProductType)
        private readonly productTypeRepository: Repository<ProductType>
    ) {}

    async findAll() {
        const productTypes = await this.productTypeRepository.find();
        return productTypes;
    }
}

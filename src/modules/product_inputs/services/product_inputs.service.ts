import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ProductInput } from "../entities/product_input.entity";

@Injectable()
export class ProductInputsService {
    constructor(
        @InjectRepository(ProductInput)
        private readonly productInputsRepository: Repository<ProductInput>
    ) {}

    async findAll() {
        const productInputs = await this.productInputsRepository.find();
        return productInputs;
    }
}

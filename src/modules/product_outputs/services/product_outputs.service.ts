import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ProductOutput } from "../entities/product_output.entity";

@Injectable()
export class ProductOutputsService {
    constructor(
        @InjectRepository(ProductOutput)
        private readonly productOutputsRepository: Repository<ProductOutput>,
    ) {}

    async findAll(): Promise<ProductOutput[]> {
        return await this.productOutputsRepository.find();
    }
}

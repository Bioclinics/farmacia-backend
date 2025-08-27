import { Injectable } from '@nestjs/common';
import { CreateProductOutputDto } from './dto/create-product_output.dto';
import { UpdateProductOutputDto } from './dto/update-product_output.dto';

@Injectable()
export class ProductOutputsService {
  create(createProductOutputDto: CreateProductOutputDto) {
    return 'This action adds a new productOutput';
  }

  findAll() {
    return `This action returns all productOutputs`;
  }

  findOne(id: number) {
    return `This action returns a #${id} productOutput`;
  }

  update(id: number, updateProductOutputDto: UpdateProductOutputDto) {
    return `This action updates a #${id} productOutput`;
  }

  remove(id: number) {
    return `This action removes a #${id} productOutput`;
  }
}

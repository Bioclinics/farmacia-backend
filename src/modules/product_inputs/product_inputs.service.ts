import { Injectable } from '@nestjs/common';
import { CreateProductInputDto } from './dto/create-product_input.dto';
import { UpdateProductInputDto } from './dto/update-product_input.dto';

@Injectable()
export class ProductInputsService {
  create(createProductInputDto: CreateProductInputDto) {
    return 'This action adds a new productInput';
  }

  findAll() {
    return `This action returns all productInputs`;
  }

  findOne(id: number) {
    return `This action returns a #${id} productInput`;
  }

  update(id: number, updateProductInputDto: UpdateProductInputDto) {
    return `This action updates a #${id} productInput`;
  }

  remove(id: number) {
    return `This action removes a #${id} productInput`;
  }
}

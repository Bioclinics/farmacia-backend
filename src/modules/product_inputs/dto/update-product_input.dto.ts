import { PartialType } from '@nestjs/swagger';
import { CreateProductInputDto } from './create-product_input.dto';

export class UpdateProductInputDto extends PartialType(CreateProductInputDto) {}

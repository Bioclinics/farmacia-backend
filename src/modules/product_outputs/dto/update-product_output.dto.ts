import { PartialType } from '@nestjs/swagger';
import { CreateProductOutputDto } from './create-product_output.dto';

export class UpdateProductOutputDto extends PartialType(CreateProductOutputDto) {}

import { ApiProperty } from '@nestjs/swagger';
import { Product } from '../entities/product.entity';

export class PaginatedProductsDto {
  @ApiProperty({ type: [Product] })
  data: Product[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  pages: number;
}

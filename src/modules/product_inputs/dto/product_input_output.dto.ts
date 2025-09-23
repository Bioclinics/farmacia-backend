import { ApiProperty } from "@nestjs/swagger";

export class ProductInputOutputDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  idProduct: number;

  @ApiProperty()
  idLaboratory: number;

  @ApiProperty()
  quantity: number;

  @ApiProperty()
  unitCost: number;

  @ApiProperty()
  subtotal: number;

  @ApiProperty()
  isAjustment: boolean;

  @ApiProperty()
  reason?: string;

  @ApiProperty()
  createdAt: Date;
}

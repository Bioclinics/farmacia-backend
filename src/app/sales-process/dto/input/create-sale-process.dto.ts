import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsInt, IsNumber, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class SaleOutputItem {
  @ApiProperty()
  @IsInt()
  idProduct: number;

  @ApiProperty()
  @IsInt()
  quantity: number;

  @ApiProperty()
  @IsNumber()
  unitPrice: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  subtotal?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  isAdjustment?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  reason?: string;
}

export class CreateSaleProcessDto {
  @ApiProperty()
  @IsInt()
  idStaff: number;

  @ApiProperty({ type: [SaleOutputItem] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SaleOutputItem)
  outputs: SaleOutputItem[];
}

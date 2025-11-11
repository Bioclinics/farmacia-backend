import { IsBoolean, IsInt, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateProductOutputDto {
  @IsOptional()
  @IsInt()
  id_sale?: number;

  @IsOptional()
  @IsInt()
  id_product?: number;

  @IsOptional()
  @IsInt()
  quantity?: number;

  @IsOptional()
  @IsNumber()
  unit_price?: number;

  @IsOptional()
  @IsNumber()
  subtotal?: number;

  @IsOptional()
  @IsBoolean()
  is_adjustment?: boolean;

  @IsOptional()
  @IsString()
  reason?: string;
}

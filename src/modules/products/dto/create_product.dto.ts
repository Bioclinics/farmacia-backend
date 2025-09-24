import { IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @IsNotEmpty()
  idType: number;

  @IsNumber()
  costPrice: number;

  @IsNumber()
  price: number;

  @IsNumber()
  stock: number;

  @IsNumber()
  minStock: number;

  @IsOptional()
  isActive?: boolean;
}

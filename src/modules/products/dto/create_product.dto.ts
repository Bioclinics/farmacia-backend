import { IsString, IsInt, IsNumber, IsOptional, IsBoolean, Min } from 'class-validator';

export class CreateProductDto {
  @IsString()
  name: string;

  @IsInt()
  idType: number;

  @IsNumber()
  price: number;

  @IsOptional()
  @IsInt()
  minStock?: number;

  @IsOptional()
  @IsInt()
  stock?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

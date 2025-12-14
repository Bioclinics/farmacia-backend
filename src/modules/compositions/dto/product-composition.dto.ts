import { Type } from 'class-transformer';
import { IsArray, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, ValidateNested } from 'class-validator';

export class ProductCompositionInputDto {
  @IsInt()
  idComposition: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  concentration: string;
}

export class AssignProductCompositionsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductCompositionInputDto)
  items: ProductCompositionInputDto[];
}

export class UpdateProductCompositionDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  concentration: string;
}

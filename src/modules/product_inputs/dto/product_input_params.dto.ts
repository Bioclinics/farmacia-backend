import { IsOptional, IsInt, IsBoolean } from "class-validator";

export class ProductInputParamsDto {
  @IsOptional()
  @IsInt()
  idProduct?: number;

  @IsOptional()
  @IsInt()
  idLaboratory?: number;

  @IsOptional()
  @IsBoolean()
  isAjustment?: boolean;
}

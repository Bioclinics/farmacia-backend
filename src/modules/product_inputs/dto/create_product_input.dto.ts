import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsInt, IsNumber, IsOptional, IsString, Min } from "class-validator";

export class CreateProductInputDto {
  @ApiProperty()
  @IsInt()
  idProduct: number;

  @ApiProperty()
  @IsInt()
  idLaboratory: number;

  @ApiProperty()
  @IsInt()
  quantity: number;

  @ApiProperty()
  @IsInt()
  @Min(1)
  unitsPerBox: number;

  @ApiProperty()
  @IsNumber()
  unitCost: number;

  @ApiProperty()
  @IsNumber()
  subtotal: number;

  @ApiProperty()
  @IsBoolean()
  isAdjustment: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  reason?: string;
}

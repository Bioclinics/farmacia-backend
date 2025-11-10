import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsInt, IsNumber, IsOptional, IsString } from "class-validator";

export class CreateProductOutputDto {
  @ApiProperty()
  @IsInt()
  idProduct: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  idSale?: number;

  @ApiProperty()
  @IsBoolean()
  isAdjustment: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiProperty()
  @IsInt()
  quantity: number;

  @ApiProperty()
  @IsNumber()
  unitPrice: number;

  @ApiProperty()
  @IsNumber()
  pay: number;
}

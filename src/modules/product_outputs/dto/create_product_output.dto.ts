import { IsBoolean, IsInt, IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProductOutputDto {
  @ApiPropertyOptional({ description: 'Id de la venta (se puede omitir al crear salidas nuevas)' })
  @IsOptional()
  @IsInt()
  id_sale?: number;

  @ApiProperty({ description: 'Id del producto' })
  @IsInt()
  id_product: number;

  @ApiProperty({ description: 'Cantidad a entregar' })
  @IsInt()
  quantity: number;

  @ApiProperty({ description: 'Precio unitario' })
  @IsNumber()
  unit_price: number;

  @ApiPropertyOptional({ description: 'Subtotal (opcional, se calcula si no se suministra)' })
  @IsOptional()
  @IsNumber()
  subtotal?: number;

  @ApiPropertyOptional({ description: 'Indica si la salida es un ajuste' })
  @IsOptional()
  @IsBoolean()
  is_adjustment?: boolean;

  @ApiPropertyOptional({ description: 'Motivo de la salida o ajuste' })
  @IsOptional()
  @IsString()
  reason?: string;
}

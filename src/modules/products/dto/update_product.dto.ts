export class UpdateProductDto {
  name?: string;
  product_types_id_type?: number;
  cost_price?: number;
  price?: number;
  stock?: number;
  min_stock?: number;
  is_active?: boolean;
  is_delete?: boolean;
  updated_at?: Date;
}

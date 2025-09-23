export class UpdateProductOutputDto {
  products_id_product?: number;
  sales_id_sale?: number;
  is_adjustment?: boolean;
  reason?: string;
  quantity?: number;
  unit_price?: number;
  pay?: number;
  created_at?: Date;
}

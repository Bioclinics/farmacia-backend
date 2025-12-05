import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ProductType } from 'src/modules/product_types/entities/product_type.entity';
import { Brand } from 'src/modules/brands/entities/brand.entity';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn()
  id_product: number;

  @Column({ length: 200 })
  name: string;

  @Column({ name: 'id_type' })
  id_type: number;

  @ManyToOne(() => ProductType, (type) => type.products)
  @JoinColumn({ name: 'id_type' })
  productType: ProductType;

  @Column({ name: 'id_brand' })
  id_brand: number;

  @ManyToOne(() => Brand, (brand) => brand.products)
  @JoinColumn({ name: 'id_brand' })
  brand: Brand;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  price: number;

  @Column({ type: 'integer', default: 0 })
  stock: number;

  @Column({ type: 'integer', default: 0 })
  min_stock: number;

  @Column({ default: true })
  is_active: boolean;

  @Column({ default: false })
  is_deleted: boolean;

  @Column({ type: 'timestamp', default: () => 'now()' })
  created_at: Date;

  @Column({ type: 'timestamp', default: () => 'now()' })
  updated_at: Date;
}

import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { Product } from 'src/modules/products/entities/product.entity';

@Entity('product_types')
export class ProductType {
  @PrimaryGeneratedColumn()
  id_type: number;

  @Column({ length: 100 })
  name: string;

  @Column({ length: 200, nullable: true })
  description: string;

  @Column({ default: true })
  is_active: boolean;

  @Column({ default: false })
  is_deleted: boolean;

  @Column({ type: 'timestamp', default: () => 'now()' })
  created_at: Date;

  @Column({ type: 'timestamp', default: () => 'now()' })
  updated_at: Date;

  @OneToMany(() => Product, (product) => product.productType)
  products: Product[];
}

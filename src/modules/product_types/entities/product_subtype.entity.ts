import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { ProductType } from './product_type.entity';
import { Product } from 'src/modules/products/entities/product.entity';

@Entity('product_subtypes')
export class ProductSubtype {
  @PrimaryGeneratedColumn()
  id_subtype: number;

  @Column({ length: 120 })
  name: string;

  @Column({ name: 'id_type' })
  id_type: number;

  @ManyToOne(() => ProductType, (type) => type.subtypes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_type' })
  type: ProductType;

  @OneToMany(() => Product, (product) => product.subtype)
  products: Product[];

  @Column({ default: true })
  is_active: boolean;

  @Column({ default: false })
  is_deleted: boolean;

  @Column({ type: 'timestamp', default: () => 'now()' })
  created_at: Date;

  @Column({ type: 'timestamp', default: () => 'now()' })
  updated_at: Date;
}

import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { ProductType } from 'src/modules/product_types/entities/product_type.entity';
import { Brand } from 'src/modules/brands/entities/brand.entity';
import { ProductComposition } from 'src/modules/compositions/entities/product_composition.entity';
import { Laboratory } from 'src/modules/laboratories/entities/laboratory.entity';
import { ProductSubtype } from 'src/modules/product_types/entities/product_subtype.entity';

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

  @Column({ name: 'id_laboratory', nullable: true })
  id_laboratory: number | null;

  @ManyToOne(() => Laboratory, { nullable: true })
  @JoinColumn({ name: 'id_laboratory' })
  laboratory: Laboratory | null;

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

  @OneToMany(() => ProductComposition, (productComposition) => productComposition.product)
  productCompositions: ProductComposition[];

  @Column({ name: 'id_subtype', nullable: true })
  id_subtype: number | null;

  @ManyToOne(() => ProductSubtype, (subtype) => subtype.products, { nullable: true })
  @JoinColumn({ name: 'id_subtype' })
  subtype: ProductSubtype | null;
}

import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { Product } from 'src/modules/products/entities/product.entity';
import { Composition } from './composition.entity';

@Entity('product_compositions')
export class ProductComposition {
  @PrimaryColumn({ name: 'id_product', type: 'int' })
  id_product: number;

  @PrimaryColumn({ name: 'id_composition', type: 'int' })
  id_composition: number;

  @Column({ name: 'concentration', type: 'varchar', length: 50 })
  concentration: string;

  @ManyToOne(() => Product, (product) => product.productCompositions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_product' })
  product: Product;

  @ManyToOne(() => Composition, (composition) => composition.productCompositions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_composition' })
  composition: Composition;
}

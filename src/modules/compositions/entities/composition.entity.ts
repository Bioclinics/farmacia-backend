import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { ProductComposition } from './product_composition.entity';

@Entity('compositions')
export class Composition {
  @PrimaryGeneratedColumn({ name: 'id_composition' })
  id_composition: number;

  @Column({ name: 'name', type: 'varchar', length: 150 })
  name: string;

  @Column({ name: 'description', type: 'text', nullable: true })
  description: string | null;

  @OneToMany(() => ProductComposition, (productComposition) => productComposition.composition)
  productCompositions: ProductComposition[];
}

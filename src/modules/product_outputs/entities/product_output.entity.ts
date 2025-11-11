import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('product_outputs')
export class ProductOutput {
  @PrimaryGeneratedColumn({ name: 'id_output', type: 'int' })
  id_output: number;

  @Column({ name: 'id_sale', type: 'int', nullable: true })
  id_sale: number;

  @Column({ name: 'id_product', type: 'int' })
  id_product: number;

  @Column({ name: 'quantity', type: 'int' })
  quantity: number;

  @Column({ name: 'unit_price', type: 'numeric', precision: 12, scale: 2 })
  unit_price: number;

  @Column({ name: 'subtotal', type: 'numeric', precision: 12, scale: 2 })
  subtotal: number;

  @Column({ name: 'is_adjustment', type: 'boolean', default: false })
  is_adjustment: boolean;

  @Column({ name: 'reason', type: 'varchar', length: 150, nullable: true })
  reason?: string;

  @Column({ name: 'created_at', type: 'timestamp', default: () => 'now()' })
  created_at: Date;
}

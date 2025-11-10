import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity("product_outputs")
export class ProductOutput {
  @PrimaryGeneratedColumn({ name: "id_output", type: "bigint" })
  id: number;

  @Column({ name: "id_product", type: "int" })
  idProduct: number;

  @Column({ name: "id_sale", type: "int", nullable: true })
  idSale: number;

  @Column({ name: "is_adjustment", type: "boolean", default: false })
  isAdjustment: boolean;

  @Column({ name: "reason", type: "varchar", length: 150, nullable: true })
  reason: string;

  @Column({ name: "quantity", type: "int" })
  quantity: number;

  @Column({ name: "unit_price", type: "decimal", precision: 10, scale: 2 })
  unitPrice: number;

  @Column({ name: "subtotal", type: "decimal", precision: 10, scale: 2 })
  subtotal: number;

  @Column({ name: "pay", type: "decimal", precision: 10, scale: 2 })
  pay: number;

  @Column({ name: "created_at", type: "timestamp", default: () => "NOW()" })
  createdAt: Date;
}

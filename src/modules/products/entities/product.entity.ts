import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { ProductType } from "../../product_types/entities/product_type.entity";

@Entity("products")
export class Product {
  @PrimaryGeneratedColumn({ name: "id_product" })
  id: number;

  @Column({ length: 200 })
  name: string;

  @Column({ name: "id_type" })
  idType: number;

  @ManyToOne(() => ProductType)
  @JoinColumn({ name: "id_type" })
  type: ProductType;

  @Column("numeric", { precision: 12, scale: 2, name: "cost_price", default: 0 })
  costPrice: number;

  @Column("numeric", { precision: 12, scale: 2 })
  price: number;

  @Column({ name: "min_stock", default: 0 })
  minStock: number;

  @Column({ default: 0 })
  stock: number;

  @Column({ name: "is_active", default: true })
  isActive: boolean;

  @Column({ name: "is_deleted", default: false })
  isDeleted: boolean;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;
}

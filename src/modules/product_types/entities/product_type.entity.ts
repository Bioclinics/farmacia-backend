import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity("product_types")
export class ProductType {
  @PrimaryGeneratedColumn({ name: "id_type" })
  id: number;

  @Column({ name: "name" })
  name: string;

  @Column({ name: "description", nullable: true })
  description?: string;

  @Column({ name: "is_active", default: true })
  isActive: boolean;

  @Column({ name: "is_deleted", default: false })
  isDeleted: boolean;
}

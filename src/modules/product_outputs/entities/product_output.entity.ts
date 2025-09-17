import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";
import { BaseFour } from "src/database/entities/base-four.entity";

@Entity("product_outputs")
export class ProductOutput extends BaseFour {
    @PrimaryGeneratedColumn({ name: "id_output", type: "bigint" })
    id: number;

    @Column({ name: "products_id_product", type: "int" })
    idProduct: number;

    @Column({ name: "quantity", type: "int" })
    quantity: number;

    @Column({ name: "unit_price", type: "decimal", precision: 10, scale: 2 })
    unitPrice: number;

    @Column({ name: "subtotal", type: "decimal", precision: 10, scale: 2 })
    subtotal: number;

    @Column({ name: "reason", type: "varchar", length: 50, nullable: true })
    reason: string;
}

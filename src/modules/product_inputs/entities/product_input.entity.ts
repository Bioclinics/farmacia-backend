import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";
import { BaseFour } from "src/database/entities/base-four.entity";

@Entity("product_inputs")
export class ProductInput extends BaseFour {
    @PrimaryGeneratedColumn({ name: "id_input", type: "bigint" })
    id: number;

    @Column({ name: "products_id_product", type: "int" })
    idProduct: number;

    @Column({ name: "laboratories_id_laboratory", type: "int" })
    idLaboratory: number;

    @Column({ name: "quantity", type: "int" })
    quantity: number;

    @Column({ name: "unit_cost", type: "decimal", precision: 10, scale: 2 })
    unitCost: number;

    @Column({ name: "subtotal", type: "decimal", precision: 10, scale: 2 })
    subtotal: number;

    @Column({ name: "is_ajustment", type: "boolean" })
    isAjustment: boolean;

    @Column({ name: "reason", type: "varchar", length: 50, nullable: true })
    reason: string;
}

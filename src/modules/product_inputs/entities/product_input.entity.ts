import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity("products_inputs")
export class ProductInput {
    @PrimaryGeneratedColumn({ name: "id_input", type: "bigint" })
    id: number;

    @Column({ name: "id_product", type: "int" })
    idProduct: number;

    @Column({ name: "id_laboratory", type: "int", nullable: true })
    idLaboratory: number;

    @Column({ name: "quantity", type: "int" })
    quantity: number;

    @Column({ name: "units_per_box", type: "int" })
    unitsPerBox: number;

    @Column({ name: "unit_cost", type: "decimal", precision: 12, scale: 2, nullable: true })
    unitCost: number;

    @Column({ name: "subtotal", type: "decimal", precision: 12, scale: 2, nullable: true })
    subtotal: number;

    @Column({ name: "is_adjustment", type: "boolean", default: false })
    isAdjustment: boolean;

    @Column({ name: "reason", type: "varchar", length: 150, nullable: true })
    reason: string;

    @Column({ name: "created_at", type: "timestamp", default: () => "NOW()" })
    createdAt: Date;
}

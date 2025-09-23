import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";
import { BaseFour } from "src/database/entities/base-four.entity";

@Entity("products")
export class Product extends BaseFour {
    @PrimaryGeneratedColumn({ name: "id_product", type: "bigint" })
    id: number;

    @Column({ name: "id_laboratory", type: "int" })
    idLaboratory: number;

    @Column({ name: "id_product_type", type: "int" })
    idProductType: number;

    @Column({ name: "name", type: "varchar", length: 200 })
    name: string;

    @Column({ name: "description", type: "text", nullable: true })
    description: string;

    @Column({ name: "stock", type: "int" })
    stock: number;

    @Column({ name: "unit_price", type: "decimal", precision: 10, scale: 2 })
    unitPrice: number;
}

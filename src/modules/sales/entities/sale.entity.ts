import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";
import { BaseFour } from "src/database/entities/base-four.entity";

@Entity("sales")
export class Sale extends BaseFour {
    @PrimaryGeneratedColumn({ name: "id_sale", type: "bigint" })
    id: number;

    @Column({ name: "id_staff", type: "int" })
    idStaff: number;

    @Column({ name: "notes", type: "varchar", length: 500, nullable: true })
    notes: string;

    @Column({ name: "total", type: "decimal", precision: 10, scale: 2 })
    total: number;
}

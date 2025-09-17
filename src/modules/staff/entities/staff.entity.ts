import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";
import { BaseFour } from "src/database/entities/base-four.entity";

@Entity("staff")
export class Staff extends BaseFour {
    @PrimaryGeneratedColumn({ name: "id_staff" })
    id: number;

    @Column({ type: "varchar", length: 200 })
    name: string;
}

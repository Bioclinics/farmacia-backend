import { BaseFour } from "src/database/entities/base-four.entity";
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";

@Entity('laboratories')
export class Laboratory extends BaseFour {
    @PrimaryGeneratedColumn({ name: 'id_laboratory' })
    id: number;

    @Column({ type: 'varchar', length: 150 })
    name: string;

}

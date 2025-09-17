import { BaseFour } from "src/database/entities/base-four.entity";
import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity('product_types')
export class ProductType extends BaseFour {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'varchar', length: 100 })
    name: string;

    @Column({ type: 'text' })
    description: string;
}

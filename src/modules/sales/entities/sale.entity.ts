import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { BaseEntity } from "src/database/entities/base.entity";
import { User } from "../../users/entities/user.entity";

@Entity("sales")
export class Sale extends BaseEntity {
    @PrimaryGeneratedColumn({ name: "id_sale", type: "bigint" })
    id: number;

    @Column({ name: "id_user", type: "int" })
    idUser: number;

    @Column({ name: "notes", type: "varchar", length: 500, nullable: true })
    notes: string;

    @Column({ name: "total", type: "decimal", precision: 10, scale: 2 })
    total: number;

    @ManyToOne(() => User, { eager: true })
    @JoinColumn({ name: "id_user" })
    user: User;

    @Column({ name: 'created_at', type: 'timestamp', default: () => 'NOW()' })
    created_at: Date;
}

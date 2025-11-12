import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { BaseEntity } from 'src/database/entities/base.entity';

@Entity('roles')
export class Role extends BaseEntity {
	@PrimaryGeneratedColumn({ name: 'id_role', type: 'bigint' })
	id: number;

	@Column({ name: 'name', type: 'varchar', length: 100 })
	name: string;
}

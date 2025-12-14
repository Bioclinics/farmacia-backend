import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from 'src/modules/users/entities/user.entity';

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn({ name: 'id_log', type: 'bigint' })
  id: number;

  @Column({ name: 'id_user', type: 'int' })
  idUser: number;

  @Column({ name: 'action', type: 'varchar', length: 50 })
  action: string;

  @Column({ name: 'table_name', type: 'varchar', length: 50 })
  tableName: string;

  @Column({ name: 'record_id', type: 'int', nullable: true })
  recordId: number | null;

  @Column({ name: 'description', type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'old_data', type: 'jsonb', nullable: true })
  oldData: Record<string, unknown> | null;

  @Column({ name: 'new_data', type: 'jsonb', nullable: true })
  newData: Record<string, unknown> | null;

  @Column({ name: 'ip_address', type: 'varchar', length: 45, nullable: true })
  ipAddress: string | null;

  @Column({ name: 'created_at', type: 'timestamp', default: () => 'NOW()' })
  createdAt: Date;

  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'id_user' })
  user?: User;
}

import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn({ name: 'id_audit_log' })
  @ApiProperty({ example: 1 })
  id!: number;

  @Column({ name: 'id_user', type: 'int', nullable: true })
  @ApiProperty({ example: 1, description: 'ID del usuario', required: false })
  id_user!: number | null;

  @Column({ type: 'varchar', length: 50 })
  @ApiProperty({ example: 'CREATE', description: 'Tipo de acción (CREATE, UPDATE, DELETE, READ)' })
  action!: string;

  // Mantener nullable para no fallar con filas antiguas
  @Column({ name: 'table_name', type: 'varchar', length: 100, nullable: true, default: '' })
  @ApiProperty({ example: 'products', description: 'Nombre de la tabla afectada' })
  tableName!: string;

  @Column({ name: 'record_id', type: 'int', nullable: true })
  @ApiProperty({ example: 5, description: 'ID del registro afectado', required: false })
  recordId!: number | null;

  @Column({ type: 'text', nullable: true })
  @ApiProperty({ example: 'Created new product', description: 'Descripción del cambio', required: false })
  description!: string | null;

  @Column({ name: 'old_data', type: 'jsonb', nullable: true })
  @ApiProperty({ example: {}, description: 'Datos anteriores', required: false })
  oldData!: Record<string, unknown> | null;

  @Column({ name: 'new_data', type: 'jsonb', nullable: true })
  @ApiProperty({ example: {}, description: 'Datos nuevos', required: false })
  newData!: Record<string, unknown> | null;

  @Column({ name: 'ip_address', type: 'varchar', length: 50, nullable: true })
  @ApiProperty({ example: '192.168.1.1', description: 'Dirección IP del cliente', required: false })
  ipAddress!: string | null;

  @Column({ name: 'created_at', type: 'timestamp', default: () => 'NOW()' })
  @ApiProperty({ example: '2024-04-01T12:00:00Z', description: 'Fecha de creación' })
  created_at!: Date;

  @ManyToOne(() => User, { eager: true, nullable: true })
  @JoinColumn({ name: 'id_user' })
  user!: User | null;
}

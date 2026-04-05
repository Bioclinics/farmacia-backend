import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('compositions')
export class Composition {
  @PrimaryGeneratedColumn({ name: 'id_composition' })
  @ApiProperty({ example: 1 })
  id_composition: number;

  // Mantener nullable para evitar fallos de sincronización con filas antiguas
  @Column({ length: 255, nullable: true, default: '' })
  @ApiProperty({ example: 'Paracetamol', description: 'Nombre del principio activo' })
  name: string;

  @Column({ type: 'text', nullable: true })
  @ApiProperty({ example: 'Analgésico y antipirético', description: 'Descripción del principio activo', required: false })
  description: string | null;

}

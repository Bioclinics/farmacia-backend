import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Product } from 'src/modules/products/entities/product.entity';

@Entity('brands')
export class Brand {
  @PrimaryGeneratedColumn({ name: 'id_brand' })
  @ApiProperty({ example: 1 })
  id_brand: number;

  @Column({ length: 100 })
  @ApiProperty({ example: 'Marca Genérica', description: 'Nombre comercial de la marca' })
  name: string;

  @OneToMany(() => Product, (product) => product.brand)
  products: Product[];
}

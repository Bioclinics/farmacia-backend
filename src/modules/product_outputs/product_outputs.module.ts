import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductOutputsService } from './services/product_outputs.service';
import { ProductOutputsController } from './api/product_outputs.controller';
import { ProductOutput } from './entities/product_output.entity';
import { ProductInput } from '../product_inputs/entities/product_input.entity';
import { Product } from '../products/entities/product.entity';
import { Sale } from '../sales/entities/sale.entity';
import { User } from '../users/entities/user.entity';
import { Brand } from '../brands/entities/brand.entity';
import { ProductType } from '../product_types/entities/product_type.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ProductOutput, ProductInput, Product, Sale, User, Brand, ProductType])],
  controllers: [ProductOutputsController],
  providers: [ProductOutputsService],
  exports: [ProductOutputsService],
})
export class ProductOutputsModule {}

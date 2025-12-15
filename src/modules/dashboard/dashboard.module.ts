import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from './api/dashboard.controller';
import { DashboardService } from './services/dashboard.service';
import { Sale } from '../sales/entities/sale.entity';
import { Product } from '../products/entities/product.entity';
import { ProductInput } from '../product_inputs/entities/product_input.entity';
import { ProductOutput } from '../product_outputs/entities/product_output.entity';
import { ProductComposition } from '../compositions/entities/product_composition.entity';
import { Composition } from '../compositions/entities/composition.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Sale, Product, ProductInput, ProductOutput, ProductComposition, Composition]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}

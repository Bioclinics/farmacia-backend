import { Module } from '@nestjs/common';
import { SalesProcessService } from './services/sales-process.service';
import { SalesProcessController } from './api/sales-process.controller';
import { SalesModule } from 'src/modules/sales/sales.module';
import { ProductOutputsModule } from 'src/modules/product_outputs/product_outputs.module';
import { ProductsModule } from 'src/modules/products/products.module';

@Module({
  imports: [SalesModule, ProductOutputsModule, ProductsModule],
  controllers: [SalesProcessController],
  providers: [SalesProcessService],
})
export class SalesProcessModule {}

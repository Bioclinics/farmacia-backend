import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Composition } from './entities/composition.entity';
import { ProductComposition } from './entities/product_composition.entity';
import { Product } from '../products/entities/product.entity';
import { CompositionsService } from './services/compositions.service';
import { CompositionsController } from './api/compositions.controller';
import { ProductCompositionsController } from './api/product-compositions.controller';
import { AuditLogsModule } from '../audit_logs/audit_logs.module';
import { ProductOutput } from '../product_outputs/entities/product_output.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Composition, ProductComposition, Product, ProductOutput]), AuditLogsModule],
  controllers: [CompositionsController, ProductCompositionsController],
  providers: [CompositionsService],
  exports: [CompositionsService],
})
export class CompositionsModule {}

// products.module.ts
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuditLogsModule } from '../audit_logs/audit_logs.module';
import { CompositionsModule } from '../compositions/compositions.module';
import { Product } from './entities/product.entity';
import { ProductSubtype } from '../product_types/entities/product_subtype.entity';
import { ProductType } from '../product_types/entities/product_type.entity';
import { Laboratory } from '../laboratories/entities/laboratory.entity';
import { ProductsController } from "./api/products.controller";
import { ProductsService } from "./services/products.service";

@Module({
  imports: [TypeOrmModule.forFeature([Product, ProductSubtype, ProductType, Laboratory]), AuditLogsModule, CompositionsModule],
  providers: [ProductsService],
  controllers: [ProductsController],
  exports: [ProductsService], // export si otro módulo lo necesita
})
export class ProductsModule {}

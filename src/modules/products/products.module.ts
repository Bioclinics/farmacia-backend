// products.module.ts
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Product } from './entities/product.entity';
import { ProductsService } from "./services/products.service";
import { ProductsController } from "./api/products.controller";
import { AuditLogsModule } from '../audit_logs/audit_logs.module';

@Module({
  imports: [TypeOrmModule.forFeature([Product]), AuditLogsModule],
  providers: [ProductsService],
  controllers: [ProductsController],
  exports: [ProductsService], // export si otro módulo lo necesita
})
export class ProductsModule {}

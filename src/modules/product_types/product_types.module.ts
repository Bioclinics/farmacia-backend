import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ProductTypesController } from "./api/product_types.controller";
import { ProductTypesService } from "./services/product_types.service";
import { ProductType } from "./entities/product_type.entity";
import { AuditLogsModule } from "../audit_logs/audit_logs.module";

@Module({
  imports: [TypeOrmModule.forFeature([ProductType]), AuditLogsModule],
  controllers: [ProductTypesController],
  providers: [ProductTypesService],
  exports: [ProductTypesService]
})
export class ProductTypesModule {}

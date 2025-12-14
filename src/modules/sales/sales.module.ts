import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { SalesService } from "./services/sales.service";
import { SalesController } from "./api/sales.controller";
import { Sale } from "./entities/sale.entity";
import { ProductOutputsModule } from "../product_outputs/product_outputs.module";
import { ProductOutput } from "../product_outputs/entities/product_output.entity";
import { Product } from "../products/entities/product.entity";
import { AuditLogsModule } from "../audit_logs/audit_logs.module";

@Module({
    imports: [
        TypeOrmModule.forFeature([Sale, ProductOutput, Product]),
        ProductOutputsModule,
        AuditLogsModule,
    ],
    controllers: [SalesController],
    providers: [SalesService],
    exports: [SalesService],
})
export class SalesModule {}

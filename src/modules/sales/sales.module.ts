import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { SalesService } from "./services/sales.service";
import { SalesController } from "./api/sales.controller";
import { Sale } from "./entities/sale.entity";
import { ProductOutputsModule } from "../product_outputs/product_outputs.module";

@Module({
    imports: [
        TypeOrmModule.forFeature([Sale]),
        ProductOutputsModule,
    ],
    controllers: [SalesController],
    providers: [SalesService],
    exports: [SalesService],
})
export class SalesModule {}

import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { SalesService } from "./services/sales.service";
import { SalesController } from "./api/sales.controller";
import { Sale } from "./entities/sale.entity";

@Module({
    imports: [TypeOrmModule.forFeature([Sale])],
    controllers: [SalesController],
    providers: [SalesService],
})
export class SalesModule {}

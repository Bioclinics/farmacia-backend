import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ProductInput } from "./entities/product_input.entity";
import { ProductInputsService } from "./services/product_inputs.service";
import { ProductInputsController } from "./api/product_inputs.controller";

@Module({
    imports: [TypeOrmModule.forFeature([ProductInput])],
    controllers: [ProductInputsController],
    providers: [ProductInputsService]
})
export class ProductInputsModule {}

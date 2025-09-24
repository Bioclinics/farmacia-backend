import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ProductTypesController } from "./api/product_types.controller";
import { ProductTypesService } from "./services/product_types.service";
import { ProductType } from "./entities/product_type.entity";

@Module({
  imports: [TypeOrmModule.forFeature([ProductType])],
  controllers: [ProductTypesController],
  providers: [ProductTypesService],
  exports: [ProductTypesService]
})
export class ProductTypesModule {}

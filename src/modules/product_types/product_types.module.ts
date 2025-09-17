import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductType } from './entities/product_type.entity';
import { ProductTypesService } from './services/product_types.service';
import { ProductTypesController } from './api/product_types.controller';

@Module({
    imports: [
        TypeOrmModule.forFeature([ProductType])
    ],
    controllers: [ProductTypesController],
    providers: [ProductTypesService],
})
export class ProductTypesModule {}

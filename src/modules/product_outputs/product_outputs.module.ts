import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductOutputsService } from './services/product_outputs.service';
import { ProductOutputsController } from './api/product_outputs.controller';
import { ProductOutput } from './entities/product_output.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ProductOutput])],
  controllers: [ProductOutputsController],
  providers: [ProductOutputsService],
  exports: [ProductOutputsService],
})
export class ProductOutputsModule {}

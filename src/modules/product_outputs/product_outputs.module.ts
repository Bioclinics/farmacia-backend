import { Module } from '@nestjs/common';
import { ProductOutputsService } from './product_outputs.service';
import { ProductOutputsController } from './product_outputs.controller';

@Module({
  controllers: [ProductOutputsController],
  providers: [ProductOutputsService],
})
export class ProductOutputsModule {}

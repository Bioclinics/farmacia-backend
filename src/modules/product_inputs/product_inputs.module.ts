import { Module } from '@nestjs/common';
import { ProductInputsService } from './product_inputs.service';
import { ProductInputsController } from './product_inputs.controller';

@Module({
  controllers: [ProductInputsController],
  providers: [ProductInputsService],
})
export class ProductInputsModule {}

import { Test, TestingModule } from '@nestjs/testing';
import { ProductOutputsController } from './product_outputs.controller';
import { ProductOutputsService } from './product_outputs.service';

describe('ProductOutputsController', () => {
  let controller: ProductOutputsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductOutputsController],
      providers: [ProductOutputsService],
    }).compile();

    controller = module.get<ProductOutputsController>(ProductOutputsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

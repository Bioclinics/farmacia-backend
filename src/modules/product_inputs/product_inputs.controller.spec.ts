import { Test, TestingModule } from '@nestjs/testing';
import { ProductInputsController } from './product_inputs.controller';
import { ProductInputsService } from './product_inputs.service';

describe('ProductInputsController', () => {
  let controller: ProductInputsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductInputsController],
      providers: [ProductInputsService],
    }).compile();

    controller = module.get<ProductInputsController>(ProductInputsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

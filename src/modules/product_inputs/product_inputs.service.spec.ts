import { Test, TestingModule } from '@nestjs/testing';
import { ProductInputsService } from './product_inputs.service';

describe('ProductInputsService', () => {
  let service: ProductInputsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProductInputsService],
    }).compile();

    service = module.get<ProductInputsService>(ProductInputsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

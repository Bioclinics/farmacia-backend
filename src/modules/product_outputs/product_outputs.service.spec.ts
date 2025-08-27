import { Test, TestingModule } from '@nestjs/testing';
import { ProductOutputsService } from './product_outputs.service';

describe('ProductOutputsService', () => {
  let service: ProductOutputsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProductOutputsService],
    }).compile();

    service = module.get<ProductOutputsService>(ProductOutputsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

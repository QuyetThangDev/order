import { Test, TestingModule } from '@nestjs/testing';
import { ProductAnalysisService } from './product-analysis.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ProductAnalysis } from './product-analysis.entity';
import { repositoryMockFactory } from 'src/test-utils/repository-mock.factory';
import { Product } from 'src/product/product.entity';
import { Branch } from 'src/branch/branch.entity';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { mapperMockFactory } from 'src/test-utils/mapper-mock.factory';
import { MAPPER_MODULE_PROVIDER } from 'src/app/app.constants';

describe('ProductAnalysisService', () => {
  let service: ProductAnalysisService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductAnalysisService,
        {
          provide: getRepositoryToken(ProductAnalysis),
          useFactory: repositoryMockFactory,
        },
        {
          provide: getRepositoryToken(Product),
          useFactory: repositoryMockFactory,
        },
        {
          provide: getRepositoryToken(Branch),
          useFactory: repositoryMockFactory,
        },
        {
          provide: MAPPER_MODULE_PROVIDER,
          useFactory: mapperMockFactory,
        },
        {
          provide: WINSTON_MODULE_NEST_PROVIDER,
          useValue: console, // Mock logger (or a custom mock)
        },
      ],
    }).compile();

    service = module.get<ProductAnalysisService>(ProductAnalysisService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
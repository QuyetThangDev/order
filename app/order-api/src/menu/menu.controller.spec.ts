import { Test, TestingModule } from '@nestjs/testing';
import { MenuController } from './menu.controller';
import { MenuService } from './menu.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Menu } from './menu.entity';
import { Branch } from 'src/branch/branch.entity';
import { MAPPER_MODULE_PROVIDER } from 'src/app/app.constants';
import { mapperMockFactory } from 'src/test-utils/mapper-mock.factory';
import { repositoryMockFactory } from 'src/test-utils/repository-mock.factory';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

describe('MenuController', () => {
  let controller: MenuController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MenuController],
      providers: [
        MenuService,
        {
          provide: getRepositoryToken(Menu),
          useValue: {},
        },
        {
          provide: getRepositoryToken(Branch),
          useValue: repositoryMockFactory,
        },
        {
          provide: MAPPER_MODULE_PROVIDER,
          useValue: mapperMockFactory,
        },
        {
          provide: WINSTON_MODULE_NEST_PROVIDER,
          useValue: console,
        },
      ],
    }).compile();

    controller = module.get<MenuController>(MenuController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
import { Test, TestingModule } from '@nestjs/testing';
import { TorManagerService } from './tor-manager.service';

describe('TorManagerService', () => {
  let service: TorManagerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TorManagerService],
    }).compile();

    service = module.get<TorManagerService>(TorManagerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

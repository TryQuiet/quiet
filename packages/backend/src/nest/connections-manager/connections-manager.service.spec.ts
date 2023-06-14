import { Test, TestingModule } from '@nestjs/testing';
import { ConnectionsManagerService } from './connections-manager.service';

describe('ConnectionsManagerService', () => {
  let service: ConnectionsManagerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ConnectionsManagerService],
    }).compile();

    service = module.get<ConnectionsManagerService>(ConnectionsManagerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

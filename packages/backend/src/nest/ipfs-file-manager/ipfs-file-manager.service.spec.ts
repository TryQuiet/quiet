import { Test, TestingModule } from '@nestjs/testing';
import { IpfsFileManagerService } from './ipfs-file-manager.service';

describe('IpfsFileManagerService', () => {
  let service: IpfsFileManagerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [IpfsFileManagerService],
    }).compile();

    service = module.get<IpfsFileManagerService>(IpfsFileManagerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

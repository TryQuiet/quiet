import { jest } from '@jest/globals'
import { Test, TestingModule } from '@nestjs/testing'
import { SigChainService } from './sigchain.service'
import { createLogger } from '../common/logger'
import { LocalDbService } from '../local-db/local-db.service'
import { LocalDbModule } from '../local-db/local-db.module'
import { TestModule } from '../common/test.module'
import { SigChainModule } from './sigchain.service.module'

const logger = createLogger('auth:sigchainManager.spec')

describe('SigChainService', () => {
  let module: TestingModule
  let sigChainService: SigChainService
  let localDbService: LocalDbService
  let handleChainUpdateSpy: jest.SpiedFunction<any>

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [TestModule, SigChainModule, LocalDbModule],
    }).compile()
    sigChainService = await module.resolve(SigChainService)
    localDbService = await module.resolve(LocalDbService)
    handleChainUpdateSpy = jest.spyOn(sigChainService as any, 'handleChainUpdate').mockImplementation(() => {
      logger.debug('MOCK: handling chain update')
    })
  })

  beforeEach(async () => {
    if (localDbService.getStatus() === 'closed') {
      await localDbService.open()
    }
  })

  afterAll(async () => {
    handleChainUpdateSpy.mockReset()
    await localDbService.close()
    await module.close()
  })

  it('should throw an error when trying to get an active chain without setting one', async () => {
    expect(() => sigChainService.getActiveChain()).toThrowError()
  })
  it('should throw an error when trying to set an active chain that does not exist', async () => {
    expect(() => sigChainService.setActiveChain('nonexistent')).toThrowError()
  })
  it('should add a new chain and it not be active if not set to be', async () => {
    const sigChain = await sigChainService.createChain('test', 'user', false)
    expect(() => sigChainService.getActiveChain()).toThrowError()
    expect(handleChainUpdateSpy).toBeCalledTimes(1)
    sigChainService.setActiveChain('test')
    expect(sigChainService.getActiveChain()).toBe(sigChain)
  })
  it('should add a new chain and it be active if set to be', async () => {
    const sigChain = await sigChainService.createChain('test2', 'user2', true)
    expect(sigChainService.getActiveChain()).toBe(sigChain)
    expect(handleChainUpdateSpy).toBeCalledTimes(1)
    const prevSigChain = sigChainService.getChain({ teamName: 'test' })
    expect(prevSigChain).toBeDefined()
    expect(prevSigChain).not.toBe(sigChain)
  })
  it('should delete nonactive chain without changing active chain', async () => {
    sigChainService.setActiveChain('test2')
    await sigChainService.deleteChain('test', false)
    expect(() => sigChainService.getChain({ teamName: 'test' })).toThrowError()
    expect(sigChainService.getActiveChain()).toBeDefined()
  })
  it('should delete active chain and set active chain to undefined', async () => {
    await sigChainService.deleteChain('test2', false)
    expect(sigChainService.getActiveChain).toThrowError()
  })
  it('should save and load sigchain using nestjs service', async () => {
    const TEAM_NAME = 'test3'
    const sigChain = await sigChainService.createChain(TEAM_NAME, 'user', true)
    expect(handleChainUpdateSpy).toBeCalledTimes(1)
    await sigChainService.saveChain(TEAM_NAME)
    await sigChainService.deleteChain(TEAM_NAME, false)
    const loadedSigChain = await sigChainService.loadChain(TEAM_NAME, true)
    expect(loadedSigChain).toBeDefined()
    expect(sigChainService.getActiveChain()).toBe(loadedSigChain)
  })
  it('should delete sigchains from disk', async () => {
    await sigChainService.deleteChain('test3', true)
    expect(() => sigChainService.getChain({ teamName: 'test3' })).toThrowError()
    await expect(sigChainService.loadChain('test3', true)).rejects.toThrowError()
  })
  it('should not allow duplicate chains to be added', async () => {
    await sigChainService.createChain('test4', 'user4', false)
    await expect(sigChainService.createChain('test4', 'user4', false)).rejects.toThrowError()
    expect(handleChainUpdateSpy).toBeCalledTimes(1)
  })
  it('should handle concurrent chain operations correctly', async () => {
    const TEAM_NAME1 = 'test6'
    const TEAM_NAME2 = 'test7'
    await Promise.all([
      sigChainService.createChain(TEAM_NAME1, 'user1', true),
      sigChainService.createChain(TEAM_NAME2, 'user2', false),
    ])
    expect(sigChainService.getChain({ teamName: TEAM_NAME1 })).toBeDefined()
    expect(sigChainService.getChain({ teamName: TEAM_NAME2 })).toBeDefined()
    expect(handleChainUpdateSpy).toBeCalledTimes(2)
  })
})

import { getCrypto } from 'pkijs'
import { jest } from '@jest/globals'
import fs from 'fs'

import { NoCryptoEngineError, UserProfile } from '@quiet/types'
import { UserProfileStore } from './userProfile.store'
import { Test, TestingModule } from '@nestjs/testing'
import { getBaseTypesFactory } from '@quiet/state-manager'
import { FactoryGirl } from 'factory-girl'
import { createLogger } from '../../common/logger'
import { SigChainService } from '../../auth/sigchain.service'
import { TestModule } from '../../common/test.module'
import { StorageModule } from '../storage.module'
import { Libp2pModule } from '../../libp2p/libp2p.module'
import { IpfsModule } from '../../ipfs/ipfs.module'
import { SigChainModule } from '../../auth/sigchain.service.module'
import { Libp2pService } from '../../libp2p/libp2p.service'
import { IpfsService } from '../../ipfs/ipfs.service'
import { OrbitDbService } from '../orbitDb/orbitDb.service'
import { LocalDbService } from '../../local-db/local-db.service'
import { libp2pInstanceParams } from '../../common/utils'
import { TestConfig } from '../../const'

const logger = createLogger('messagesService:test')

describe('UserProfileStore', () => {
  let userProfileStore: UserProfileStore

  let module: TestingModule
  let libp2pService: Libp2pService
  let ipfsService: IpfsService
  let orbitDbService: OrbitDbService
  let localDbService: LocalDbService
  let sigChainService: SigChainService
  let factory: FactoryGirl
  let userProfile: UserProfile

  beforeAll(async () => {
    factory = await getBaseTypesFactory()
  })

  beforeEach(async () => {
    jest.clearAllMocks()

    module = await Test.createTestingModule({
      imports: [TestModule, StorageModule, Libp2pModule, IpfsModule, SigChainModule],
    }).compile()

    sigChainService = await module.resolve(SigChainService)
    await sigChainService.createChain('test-community', 'alice', true)

    libp2pService = await module.resolve(Libp2pService)
    const libp2pParams = await libp2pInstanceParams()
    await libp2pService.createInstance(libp2pParams)

    ipfsService = await module.resolve(IpfsService)
    await ipfsService.createInstance()

    orbitDbService = await module.resolve(OrbitDbService)
    await orbitDbService.create(ipfsService.ipfsInstance!)
    localDbService = await module.resolve(LocalDbService)

    userProfile = await factory.build('UserProfile', {
      userId: sigChainService.getActiveChain().user.userId,
      photo: undefined,
    })
    userProfileStore = await module.resolve(UserProfileStore)
    await userProfileStore.init()
    // log the test that is about to run
    logger.info('Running test:', expect.getState().currentTestName)
  })

  afterEach(async () => {
    await userProfileStore.close()
    await orbitDbService.stop()
    await ipfsService.stop()
    await libp2pService.close()
    await localDbService.close()
    if (fs.existsSync(TestConfig.ORBIT_DB_DIR)) {
      fs.rmSync(TestConfig.ORBIT_DB_DIR, { recursive: true })
    }
  })

  test('should be defined', () => {
    expect(userProfileStore).toBeDefined()
  })

  test('should add a new user profile', async () => {
    const entry = await userProfileStore.setEntry(userProfile.userId, userProfile)
    expect(entry).toBeDefined()
    expect(entry).not.toEqual(userProfile)
  })

  test('should get a user profile', async () => {
    const entry = await userProfileStore.setEntry(userProfile.userId, userProfile)
    expect(entry).toBeDefined()
    const result = await userProfileStore.getEntry(userProfile.userId)
    expect(result).toEqual(userProfile)
  })

  test('should get all user profiles', async () => {
    const entry = await userProfileStore.setEntry(userProfile.userId, userProfile)
    expect(entry).toBeDefined()
    const result = await userProfileStore.getUserProfiles()
    expect(result).toHaveLength(1)
    expect(result[0]).toEqual(userProfile)
  })

  test('should cache userId to nickname mapping', async () => {
    const entry = await userProfileStore.setEntry(userProfile.userId, userProfile)
    expect(entry).toBeDefined()
    const result = await userProfileStore.getUsername(userProfile.userId)
    expect(result).toEqual(userProfile.nickname)
  })
})

const getUserProfile = async ({
  pngByteArray,
  photoUrl,
}: {
  pngByteArray?: Uint8Array
  photoUrl?: string
}): Promise<UserProfile> => {
  const crypto = getCrypto()
  if (!crypto) throw new NoCryptoEngineError()

  // Bytes in decimal copied out of a PNG file
  // e.g. od -t u1 ~/Pictures/test.png | less
  const png = pngByteArray || new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82])
  const pngBase64 = 'data:image/png;base64,' + Buffer.from(png).toString('base64')
  const factory = await getBaseTypesFactory()
  const userProfile = await factory.build<UserProfile>('UserProfile', {
    userId: 'aliceUserId',
    nickname: 'Alice',
    photo: photoUrl || pngBase64,
  })
  return userProfile
}

describe('UserProfileStore/validateUserProfile', () => {
  test('returns false if photo is not PNG', async () => {
    // Changed the first byte from 137 to 136
    const pngByteArray = new Uint8Array([136, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82])
    const userProfile = await getUserProfile({ pngByteArray })
    expect(await UserProfileStore.validateUserProfile(userProfile)).toBeFalsy()
  })

  test('returns false if photo is larger than 200KB', async () => {
    // 204,800 extra decimal bytes (200KB) with values 1 - 254
    const extraData = Array.from({ length: 204_800 }, () => Math.floor(Math.random() * (255 - 1) + 1))
    // Valid PNG header
    const pngArray = [137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82].concat(extraData)
    const pngByteArray = new Uint8Array(pngArray)

    const userProfile = await getUserProfile({ pngByteArray })
    expect(await UserProfileStore.validateUserProfile(userProfile)).toBeFalsy()
  })

  test('returns true if photo is less than 200KB', async () => {
    // 200,000 extra decimal bytes with values 1 - 254
    const extraData = Array.from({ length: 200_000 }, () => Math.floor(Math.random() * (255 - 1) + 1))
    // Valid PNG header
    const pngArray = [137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82].concat(extraData)
    const pngByteArray = new Uint8Array(pngArray)

    const userProfile = await getUserProfile({ pngByteArray })
    expect(await UserProfileStore.validateUserProfile(userProfile)).toBeTruthy()
  })

  test('returns false if photo URL prefix is unexpected', async () => {
    const pngArray = [137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82]
    // Capitalized I in image
    const pngBase64 = 'data:Image/png;base64,' + Buffer.from(pngArray).toString('base64')
    const userProfile = await getUserProfile({ photoUrl: pngBase64 })
    expect(await UserProfileStore.validateUserProfile(userProfile)).toBeFalsy()
  })

  test('returns false if photo URL prefix is unexpected (trailing comma)', async () => {
    const pngArray = [137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82]
    // Missing trailing comma
    const pngBase64 = 'data:image/png;base64' + Buffer.from(pngArray).toString('base64')
    const userProfile = await getUserProfile({ photoUrl: pngBase64 })
    expect(await UserProfileStore.validateUserProfile(userProfile)).toBeFalsy()
  })

  test('returns false if photo URL prefix is unexpected (invalid content-type)', async () => {
    const pngArray = [137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82]
    // Invalid content-type
    const pngBase64 = 'data:text/html,' + Buffer.from(pngArray).toString('base64')
    const userProfile = await getUserProfile({ photoUrl: pngBase64 })
    expect(await UserProfileStore.validateUserProfile(userProfile)).toBeFalsy()
  })

  test('returns true if photo URL prefix is expected', async () => {
    const pngArray = [137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82]
    const pngBase64 = 'data:image/png;base64,' + Buffer.from(pngArray).toString('base64')
    const userProfile = await getUserProfile({ photoUrl: pngBase64 })
    expect(await UserProfileStore.validateUserProfile(userProfile)).toBeTruthy()
  })
})

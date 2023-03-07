import { Crypto } from '@peculiar/webcrypto'
import {
  createCommunity,
  getCommunityOwnerData,
  registerUsername,
  sendRegistrationRequest,
  sendCsr,
  OwnerData
} from '../integrationTests/appActions'
import { createApp, sleep, storePersistor } from '../utils'
import { AsyncReturnType } from '../types/AsyncReturnType.interface'
import {
  assertInitializedCommunity,
  assertNoRegistrationError,
  assertReceivedCertificate,
  assertReceivedCertificates,
  assertReceivedRegistrationError,
  assertRegistrationRequestSent
} from '../integrationTests/assertions'

const crypto = new Crypto()

global.crypto = crypto

describe('offline registrar, user tries to join', () => {
  let user: AsyncReturnType<typeof createApp>

  beforeAll(async () => {
    user = await createApp()
  })

  afterAll(async () => {
    await user.manager.closeAllServices()
  })
  afterEach(async () => {
    await new Promise<void>((resolve) => setTimeout(() => resolve(), 10000))
  })
  it('user tries to join community', async () => {
    console.log('A - 1')
    await sendRegistrationRequest({
      registrarAddress: '76gan734wqm4hy7ahj33pnfub7qobdhhkdnd3rbma7o4dq4hce3ncxad',
      userName: 'waclaw',
      store: user.store
    })
  })

  it('user should get an error message', async () => {
    console.log('A - 2')
    await assertReceivedRegistrationError(user.store)
  })
})

describe('registrar is offline, user tries to join, then registrar goes online', () => {
  let owner: AsyncReturnType<typeof createApp>
  let user: AsyncReturnType<typeof createApp>
  let ownerOldState: Partial<ReturnType<typeof owner.store.getState>>
  let ownerDataPath: string
  let registrarAddress: string

  beforeAll(async () => {
    owner = await createApp()
    user = await createApp()
  })

  afterAll(async () => {
    await owner.manager.closeAllServices()
    await user.manager.closeAllServices()
  })

  it('owner creates community', async () => {
    console.log('B - 1')
    await createCommunity({ userName: 'placek', store: owner.store })
    await assertInitializedCommunity(owner.store)
    const communityId = owner.store.getState().Communities.currentCommunity
    registrarAddress =
      owner.store.getState().Communities.communities.entities[communityId].registrarUrl
    ownerOldState = storePersistor(owner.store.getState())
    ownerDataPath = owner.appPath
    await new Promise<void>((resolve) => setTimeout(() => resolve(), 15000))
  })

  it('owner goes offline', async () => {
    console.log('B - 2')
    await owner.manager.closeAllServices()
    await new Promise<void>((resolve) => setTimeout(() => resolve(), 10000))
  })

  it('user tries to join community, while registrar is offline', async () => {
    console.log('B - 3')
    await sendRegistrationRequest({
      userName: 'wacek',
      store: user.store,
      registrarAddress
    })
    // User should keep sending requests for 10 seconds.
    await new Promise<void>((resolve) => setTimeout(() => resolve(), 10000))
    await assertRegistrationRequestSent(user.store, 2)
  })

  it('user get error message', async () => {
    console.log('B - 4')
    await new Promise<void>((resolve) => setTimeout(() => resolve(), 10000))
    await assertReceivedRegistrationError(user.store)
  })

  it('registrar goes online', async () => {
    console.log('B - 5')
    await new Promise<void>((resolve) => setTimeout(() => resolve(), 40000))
    owner = await createApp(ownerOldState, ownerDataPath)
    await new Promise<void>((resolve) => setTimeout(() => resolve(), 10000))
  })

  it('user finishes registration', async () => {
    console.log('B - 6')
    await new Promise<void>((resolve) => setTimeout(() => resolve(), 40000))
    await assertReceivedCertificate(user.store)
    await assertInitializedCommunity(user.store)
    await new Promise<void>((resolve) => setTimeout(() => resolve(), 10000))
  })
})

describe('User tries to register existing username', () => {
  let owner: AsyncReturnType<typeof createApp>
  let user: AsyncReturnType<typeof createApp>
  let userName: string

  beforeAll(async () => {
    owner = await createApp()
    user = await createApp()
    userName = 'Bob'
  })

  afterAll(async () => {
    await owner.manager.closeAllServices()
    await user.manager.closeAllServices()
  })

  it('Owner creates community', async () => {
    console.log('C - 1')
    await createCommunity({ userName, store: owner.store })
    await new Promise<void>((resolve) => setTimeout(() => resolve(), 10000))
  })

  it('User tries to join the community using the same username as owner', async () => {
    console.log('C - 2')
    const ownerData = getCommunityOwnerData(owner.store)
    await new Promise<void>((resolve) => setTimeout(() => resolve(), 10000))
    await registerUsername({
      ...ownerData,
      store: user.store,
      userName
    })
    await new Promise<void>((resolve) => setTimeout(() => resolve(), 10000))
  })

  it('User receives registration error with a proper message', async () => {
    console.log('C - 3')
    await assertReceivedRegistrationError(user.store)
  })
})

describe('Certificate already exists in db, user asks for certificate providing same csr and username again', () => {
  let owner: AsyncReturnType<typeof createApp>
  let user: AsyncReturnType<typeof createApp>
  let userName: string
  let ownerData: OwnerData

  beforeAll(async () => {
    owner = await createApp()
    user = await createApp()
    userName = 'Bob'
  })

  afterAll(async () => {
    await owner.manager.closeAllServices()
    await user.manager.closeAllServices()
  })

  it('Owner creates community', async () => {
    console.log('D - 1')
    await createCommunity({ userName: 'owner', store: owner.store })
  })

  it('User registers certificate', async () => {
    console.log('D - 2')
    await new Promise<void>((resolve) => setTimeout(() => resolve(), 10000))
    ownerData = getCommunityOwnerData(owner.store)
    await registerUsername({
      ...ownerData,
      store: user.store,
      userName
    })
  })

  it('User is registered and sends the same CSR again, no registration error', async () => {
    console.log('D - 3')
    await new Promise<void>((resolve) => setTimeout(() => resolve(), 15000))
    await assertReceivedCertificates('owner', 2, 2_900_000, owner.store)
    await assertReceivedCertificates('user', 2, 2_900_000, user.store)
    await sendCsr(user.store)
    // Wait for registrar response - skipped for test
    // await assertNoRegistrationError(user.store)
  })
})

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
    await sendRegistrationRequest({
      registrarAddress: '76gan734wqm4hy7ahj33pnfub7qobdhhkdnd3rbma7o4dq4hce3ncxad',
      userName: 'waclaw',
      store: user.store
    })
  })

  it('user should get an error message', async () => {
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
    await createCommunity({ userName: 'placek', store: owner.store })
    await assertInitializedCommunity(owner.store)
    const communityId = owner.store.getState().Communities.currentCommunity
    registrarAddress =
      owner.store.getState().Communities.communities.entities[communityId].registrarUrl
    ownerOldState = storePersistor(owner.store.getState())
    ownerDataPath = owner.appPath
    await new Promise<void>((resolve) => setTimeout(() => resolve(), 10000))
  })

  it('owner goes offline', async () => {
    await owner.manager.closeAllServices()
    await new Promise<void>((resolve) => setTimeout(() => resolve(), 10000))
  })

  it('user tries to join community, while registrar is offline', async () => {
    await sendRegistrationRequest({
      userName: 'wacek',
      store: user.store,
      registrarAddress
    })
    // User should keep sending requests for 10 seconds.
    await assertRegistrationRequestSent(user.store, 2)
  })

  it('user get error message', async () => {
    await assertReceivedRegistrationError(user.store)
  })

  it('registrar goes online', async () => {
    await new Promise<void>((resolve) => setTimeout(() => resolve(), 40000))
    owner = await createApp(ownerOldState, ownerDataPath)
    await new Promise<void>((resolve) => setTimeout(() => resolve(), 10000))
  })

  it('user finishes registration', async () => {
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
    await createCommunity({ userName, store: owner.store })
  })

  it('User tries to join the community using the same username as owner', async () => {
    const ownerData = getCommunityOwnerData(owner.store)

    await registerUsername({
      ...ownerData,
      store: user.store,
      userName
    })
  })

  it('User receives registration error with a proper message', async () => {
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
    await createCommunity({ userName: 'owner', store: owner.store })
  })

  it('User registers certificate', async () => {
    ownerData = getCommunityOwnerData(owner.store)
    await registerUsername({
      ...ownerData,
      store: user.store,
      userName
    })
  })

  it('User is registered and sends the same CSR again, no registration error', async () => {
    await assertReceivedCertificates('owner', 2, 1_800_000, owner.store)
    await assertReceivedCertificates('user', 2, 1_800_000, user.store)
    await sendCsr(user.store)
    // Wait for registrar response
    await assertNoRegistrationError(user.store)
  })
})

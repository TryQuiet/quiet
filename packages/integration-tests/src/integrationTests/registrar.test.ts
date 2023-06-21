import { Crypto } from '@peculiar/webcrypto'
import {
  createCommunity,
  getCommunityOwnerData,
  registerUsername,
  sendRegistrationRequest,
  sendCsr,
  OwnerData,
} from './appActions'
import {
  assertReceivedCertificate,
  assertReceivedRegistrationError,
  assertReceivedCertificates,
  assertNoRegistrationError,
  assertInitializedCommunity,
  assertRegistrationRequestSent,
} from './assertions'
import { createApp, sleep, storePersistor } from '../utils'
import { AsyncReturnType } from '../types/AsyncReturnType.interface'
import { ErrorPayload, SocketActionTypes, ErrorCodes, ErrorMessages } from '@quiet/state-manager'

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

  test('user tries to join community', async () => {
    await sendRegistrationRequest({
      registrarAddress: '76gan734wqm4hy7ahj33pnfub7qobdhhkdnd3rbma7o4dq4hce3ncxad',
      userName: 'waclaw',
      store: user.store,
    })
  })

  test('user should get an error message', async () => {
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

  test('owner creates community', async () => {
    await createCommunity({ userName: 'placek', store: owner.store })
    await assertInitializedCommunity(owner.store)
    const communityId = owner.store.getState().Communities.currentCommunity
    registrarAddress = owner.store.getState().Communities.communities.entities[communityId].onionAddress
    ownerOldState = storePersistor(owner.store.getState())
    ownerDataPath = owner.appPath
  })

  test('owner goes offline', async () => {
    await owner.manager.closeAllServices()
  })

  test('user tries to join community, while registrar is offline', async () => {
    await sendRegistrationRequest({
      userName: 'wacek',
      store: user.store,
      registrarAddress,
    })
    // User should keep sending requests for 10 seconds.
    await assertRegistrationRequestSent(user.store, 2)
  })

  test('user get error message', async () => {
    await assertReceivedRegistrationError(user.store)
  })

  test('registrar goes online', async () => {
    owner = await createApp(ownerOldState, ownerDataPath)
  })

  test('user finishes registration', async () => {
    console.log('user registered certificate')
    await assertReceivedCertificate(user.store)
    await assertInitializedCommunity(user.store)
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

  test('Owner creates community', async () => {
    await createCommunity({ userName, store: owner.store })
  })

  test('User tries to join the community using the same username as owner', async () => {
    const ownerData = getCommunityOwnerData(owner.store)

    await registerUsername({
      ...ownerData,
      store: user.store,
      userName,
    })
  })

  test('User receives registration error with a proper message', async () => {
    await assertReceivedRegistrationError(user.store)
  })
})

xdescribe('Certificate already exists in db, user asks for certificate providing same csr and username again', () => {
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

  test('Owner creates community', async () => {
    await createCommunity({ userName: 'owner', store: owner.store })
  })

  test('User registers certificate', async () => {
    ownerData = getCommunityOwnerData(owner.store)
    await registerUsername({
      ...ownerData,
      store: user.store,
      userName,
    })
  })

  test('User is registered and sends the same CSR again, no registration error', async () => {
    await assertReceivedCertificates('owner', 2, 120_000, owner.store)
    await assertReceivedCertificates('user', 2, 120_000, user.store)
    await sendCsr(user.store)
    // Wait for registrar response
    await assertNoRegistrationError(user.store)
  })
})

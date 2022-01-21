import { Crypto } from '@peculiar/webcrypto'
import { createCommunity, getCommunityOwnerData, registerUsername, sendRegistrationRequest } from './appActions'
import { assertReceivedCertificate, assertReceivedRegistrationError } from './assertions'
import { createApp, sleep } from '../utils'
import { AsyncReturnType } from '../types/AsyncReturnType.interface'
import { ErrorPayload, SocketActionTypes } from '@zbayapp/nectar'

jest.setTimeout(120_000)
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
      store: user.store
    })
  })

  test('user should get an error message', async () => {
    await assertReceivedRegistrationError(user.store)
  })
})

describe('registrar is offline, user tries to join, then registrar goes online', () => {
  let owner: AsyncReturnType<typeof createApp>
  let user: AsyncReturnType<typeof createApp>
  let ownerOldState: ReturnType<typeof owner.store.getState>
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
    const communityId = owner.store.getState().Communities.currentCommunity
    registrarAddress =
      owner.store.getState().Communities.communities.entities[communityId].onionAddress
    ownerOldState = owner.store.getState()
    ownerDataPath = owner.appPath
    // Give orbitDB enough time to subscribe to topics.
    await sleep(3_000)
  })

  test('owner goes offline', async () => {
    await owner.manager.closeAllServices()
  })

  test('user tries to join community, while registrar is offline', async () => {
    await sendRegistrationRequest({
      userName: 'wacek',
      store: user.store,
      registrarAddress
    })
    // User should keep sending requests for 10 seconds.
    await sleep(10_000)
  })

  test('user get error message', async () => {
    const communityId = user.store.getState().Communities.currentCommunity
    const expectedError: ErrorPayload = {
      communityId,
      code: 500,
      message: 'Registering username failed.',
      type: SocketActionTypes.REGISTRAR
    }
    await assertReceivedRegistrationError(user.store, expectedError)
  })

  test('registrar goes online', async () => {
    owner = await createApp(ownerOldState, ownerDataPath)
  })

  test('user finishes registration', async () => {
    console.log('user registered certificate')
    await assertReceivedCertificate(user.store)
    // Let the joining user finish launching community, suubscribing etc.
    await sleep(10_000)
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
      userName
    })
  })

  test('User receives registration error with a proper message', async () => {
    const userCommunityId = user.store.getState().Communities.currentCommunity
    const expectedError: ErrorPayload = {
      communityId: userCommunityId,
      code: 403,
      message: 'Username already taken.',
      type: SocketActionTypes.REGISTRAR
    }
    await assertReceivedRegistrationError(user.store, expectedError)
  })
})

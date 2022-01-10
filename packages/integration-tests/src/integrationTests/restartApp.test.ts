import { Crypto } from '@peculiar/webcrypto'
import {
  createCommunity,
  clearInitializedCommunitiesAndRegistrars
} from './appActions'
import { createApp, sleep } from '../utils'
import { AsyncReturnType } from '../types/AsyncReturnType.interface'
import { assertInitializedExistingCommunitiesAndRegistrars } from './assertions'

jest.setTimeout(600_000)
const crypto = new Crypto()

global.crypto = crypto

describe('restart app without doing anything', () => {
  let owner: AsyncReturnType<typeof createApp>
  let store: typeof owner.store
  let oldState: ReturnType<typeof owner.store.getState>

  beforeAll(async () => {
    owner = await createApp()
  })

  afterAll(async () => {
    await owner.manager.closeAllServices()
  })

  test('Owner creates community', async () => {
  })

  test('Owner successfully closes app', async () => {
    store = owner.store
    await owner.manager.closeAllServices()
  })

  test('Owner relaunch application with previous state', async () => {
    oldState = store.getState()
    owner = await createApp(oldState)
    // Wait before checking state in case some unwanted actions are executing and manipulating store
    await sleep(20_000)
    store = owner.store
  })

  test('Assert that owner store is correct', async () => {
    const currentState = store.getState()
    expect(currentState).toMatchObject(oldState)
  })
})

describe('create community and restart app', () => {
  let owner: AsyncReturnType<typeof createApp>
  let store: typeof owner.store
  let oldState: ReturnType<typeof owner.store.getState>

  beforeAll(async () => {
    owner = await createApp()
  })

  afterAll(async () => {
    await owner.manager.closeAllServices()
  })

  test('Owner creates community', async () => {
    await createCommunity({ userName: 'Owner', store: owner.store })
    store = owner.store
    // Give orbitDB enough time to subscribe to topics.
    await sleep(5_000)
  })

  test('Owner successfully closes app', async () => {
    await owner.manager.closeAllServices()
  })

  test('Owner relaunch application with previous state', async () => {
    oldState = store.getState()
    // Clear Initialized communities and registrars to make sure they are reinitialized
    clearInitializedCommunitiesAndRegistrars(store)
    owner = await createApp(oldState)
    // Wait before checking state in case some unwanted actions are executing and manipulating store
    await sleep(10_000)
    store = owner.store
    const currentState = store.getState()
    expect(currentState).toMatchObject(oldState)
  })

  test('Assert community and registrar are initialized', async () => {
    await assertInitializedExistingCommunitiesAndRegistrars(store)
  })
})

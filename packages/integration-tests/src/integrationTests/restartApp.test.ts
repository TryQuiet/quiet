import { Crypto } from '@peculiar/webcrypto'
import { createApp, sleep, storePersistor } from '../utils'
import { AsyncReturnType } from '../types/AsyncReturnType.interface'
import {
  assertInitializedCommunity,
  assertInitializedExistingCommunitiesAndRegistrars,
  assertStoreStatesAreEqual,
  assertTorBootstrapped
} from '../integrationTests/assertions'
import { createCommunity } from '../integrationTests/appActions'

const crypto = new Crypto()

global.crypto = crypto

describe('restart app without doing anything', () => {
  let owner: AsyncReturnType<typeof createApp>
  let store: typeof owner.store
  let oldState: Partial<ReturnType<typeof owner.store.getState>>
  let dataPath: string

  beforeAll(async () => {
    owner = await createApp()
    await assertTorBootstrapped(owner.store)
  })

  afterAll(async () => {
    await owner.manager.closeAllServices()
  })

  it('Owner successfully closes app', async () => {
    console.log('1a')
    store = owner.store
    await owner.manager.closeAllServices()
  })

  it('Owner relaunch application with previous state', async () => {
    console.log('2a')
    oldState = storePersistor(store.getState())
    dataPath = owner.appPath
    owner = await createApp(oldState, dataPath)
    await assertTorBootstrapped(owner.store)
    store = owner.store
  })

  it('Assert that owner store is correct', async () => {
    console.log('3a')
    const currentState = store.getState()
    await assertStoreStatesAreEqual(oldState, currentState)
  })
})

describe('create community and restart app', () => {
  let owner: AsyncReturnType<typeof createApp>
  let store: typeof owner.store
  let oldState: Partial<ReturnType<typeof owner.store.getState>>
  let dataPath: string

  beforeAll(async () => {
    owner = await createApp()
    await assertTorBootstrapped(owner.store)
  })

  afterAll(async () => {
    await owner.manager.closeAllServices()
  })

  it('Owner creates community', async () => {
    console.log('1b')
    await createCommunity({ userName: 'Owner', store: owner.store })
    await assertInitializedCommunity(owner.store)
    store = owner.store
  })

  it('Owner successfully closes app', async () => {
    await owner.manager.closeAllServices()
    await sleep(5000)
  })

  it('Owner relaunch application with previous state', async () => {
    console.log('3b')
    oldState = storePersistor(store.getState())
    console.log({ oldState })
    dataPath = owner.appPath
    try {
      owner = await createApp(oldState, dataPath)
      await assertTorBootstrapped(owner.store)
    } catch (e) {
      console.log({ e })
    }

    store = owner.store

    const currentState = store.getState()

    await assertStoreStatesAreEqual(oldState, currentState)
  })

  it('Assert community and registrar are initialized', async () => {
    console.log('4b')
    await assertInitializedExistingCommunitiesAndRegistrars(store)
  })
})

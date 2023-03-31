import { Crypto } from '@peculiar/webcrypto'
import { createApp, storePersistor } from '../utils'
import { AsyncReturnType } from '../types/AsyncReturnType.interface'
import {
  assertInitializedCommunity,
  assertInitializedExistingCommunitiesAndRegistrars,
  assertStoreStatesAreEqual
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
    console.log('2b')
    await new Promise<void>((resolve) => setTimeout(() => resolve(), 10000))
    try {
      await owner.manager.closeAllServices()
    } catch (e) {
      console.log(e)
    }
  })

  it('Owner relaunch application with previous state', async () => {
    console.log('3b')
    oldState = storePersistor(store.getState())
    dataPath = owner.appPath
    owner = await createApp(oldState, dataPath)
    store = owner.store
    const currentState = store.getState()
    await assertStoreStatesAreEqual(oldState, currentState)
  })

  it('Assert community and registrar are initialized', async () => {
    console.log('4b')
    await assertInitializedExistingCommunitiesAndRegistrars(store)
  })
})

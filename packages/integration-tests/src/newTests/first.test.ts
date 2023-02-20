// /* eslint-disable import/first */

// jest.useFakeTimers()
// Date.now = jest.fn(() => 1503187200000)

import { Crypto } from '@peculiar/webcrypto'
import { createCommunity } from '../integrationTests/appActions'
import { AsyncReturnType } from '../types/AsyncReturnType.interface'
import { createApp, sleep } from '../utils'

// const crypto = new Crypto()

// global.crypto = crypto

describe.only('owner creates community', () => {
  let owner: AsyncReturnType<typeof createApp>

  beforeAll(async () => {
    owner = await createApp()
    await new Promise<void>(resolve => setTimeout(() => resolve(), 5000))
  })

  afterAll(async () => {
    await owner.manager.closeAllServices()
  })

  it.only('Owner creates community', async () => {
    console.log('xddd')
    await createCommunity({ userName: 'owner', store: owner.store })
    // Give orbitDB enough time to subscribe to topics.
    await sleep(5_000)
  })
})

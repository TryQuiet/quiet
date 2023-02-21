
import { createCommunity } from '../integrationTests/appActions'
import { AsyncReturnType } from '../types/AsyncReturnType.interface'
import { createApp, sleep } from '../utils'

describe('owner creates community', () => {
  let owner: AsyncReturnType<typeof createApp>

  beforeAll(async () => {
    owner = await createApp()
  })

  afterAll(async () => {
    await owner.manager.closeAllServices()
  })

  it('Owner creates community', async () => {
    await createCommunity({ userName: 'owner', store: owner.store })
    // Give orbitDB enough time to subscribe to topics.
    await sleep(5_000)
  })
})

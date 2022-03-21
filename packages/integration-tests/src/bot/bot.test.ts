import waitForExpect from "wait-for-expect"
import { registerUsername, sendMessage } from "../integrationTests/appActions"
import { assertReceivedChannelsAndSubscribe } from "../integrationTests/assertions"
import { AsyncReturnType } from "../types/AsyncReturnType.interface"
import { createApp, sleep } from "../utils"
import logger from '../logger'
const log = logger('bot')

function getRandomInt(min: number, max: number) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min) + min);
}

describe('Bots sending messages', () => {
  let app: AsyncReturnType<typeof createApp>
  const timeout = 120_000
  let username: string
  
  beforeAll(async () => {
    app = await createApp()
    username = `bot_${(Math.random() + 1).toString(36).substring(7)}`
  })

  it('registers username', async () => {
    const store = app.store
    const payload = {
        registrarAddress: 'zdfw2dq2z7gtwsio3qk6gdfcn6pbq7apdxjrswedaaztyssfyyrkwmyd',
        userName: username,
        registrarPort: null,
        store: store
    }
    await registerUsername(payload)

    const communityId = store.getState().Communities.communities.ids[0]

    await waitForExpect(() => {
      expect(
        store.getState().Identity.identities.entities[communityId].userCertificate
      ).toBeTruthy()
    }, timeout)
    await assertReceivedChannelsAndSubscribe(username, 2, 120_000, store)
  })

  it('sends messages', async () => {
    for (let i=0; i < 20; i++) {
      await sendMessage({
        message: `${username} says hi ${i}`,
        channelName: 'bot-spam',
        store: app.store
      })
      const userTypingTime = getRandomInt(1000, 10_000)
      log(`Waiting ${userTypingTime}ms to send a message`)
      await sleep(userTypingTime)
    }

    await sleep(10_000)    
  })

})
import waitForExpect from "wait-for-expect"
import { registerUsername, sendMessage } from "../integrationTests/appActions"
import { assertReceivedChannelsAndSubscribe } from "../integrationTests/assertions"
import { AsyncReturnType } from "../types/AsyncReturnType.interface"
import { createApp, sleep } from "../utils"
import logger from '../logger'
const log = logger('bot')

jest.setTimeout(500_000)

function getRandomInt(min: number, max: number) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min) + min);
}

describe('Bots sending messages', () => {
  const timeout = 120_000
  let apps: Map<string, AsyncReturnType<typeof createApp>> = new Map()
  
  beforeAll(async () => {
    for (let i=0; i < 3; i++) {
      apps.set(`bot_${(Math.random() + 1).toString(36).substring(7)}`, await createApp())
    }
  })

  it('register users', async () => {
    for (const [username, app] of apps) {
      const store = app.store
      const payload = {
          registrarAddress: 'zdfw2dq2z7gtwsio3qk6gdfcn6pbq7apdxjrswedaaztyssfyyrkwmyd',
          userName: username,
          registrarPort: null,
          store: store
      }
      log(`Registering ${username}`)
      await registerUsername(payload)
  
      const communityId = store.getState().Communities.communities.ids[0]
  
      await waitForExpect(() => {
        expect(
          store.getState().Identity.identities.entities[communityId].userCertificate
        ).toBeTruthy()
      }, timeout)
      await assertReceivedChannelsAndSubscribe(username, 2, 120_000, store)
    }
  })

  it('send messages', async () => {
    const allMessagesCount = 50
    const messagesPerUser = Math.floor(allMessagesCount / apps.size)
    
    const messagesToSend = new Map()
    for (const [username, _app] of apps) {
      messagesToSend.set(username, messagesPerUser)
    }

    while (messagesToSend.size > 0) {
      const usernames = Array.from(messagesToSend.keys())
      const currentUsername = usernames[Math.floor(Math.random() * usernames.length)]
      const messagesLeft = messagesToSend.get(currentUsername)
      await sendMessageWithLatency(currentUsername, apps.get(currentUsername).store, `(${messagesLeft}) What's up?`)
      if (messagesLeft - 1 === 0) {
        messagesToSend.delete(currentUsername)
        log(`User ${currentUsername} is finished with sending messages`)
        continue
      }
      messagesToSend.set(currentUsername, messagesLeft - 1)
    }

    await sleep(10_000)    
  })

})

async function sendMessageWithLatency(username: string, store, message: string) {
  const userTypingTime = getRandomInt(5000, 10_000)
  log(`${username} is waiting ${userTypingTime}ms to send a message`)
  await sleep(userTypingTime)
  await sendMessage({
    message,
    channelName: 'bot-spam',
    store: store
  })
}
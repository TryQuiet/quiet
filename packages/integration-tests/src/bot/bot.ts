import assert from 'assert'
import { sendMessage } from "../integrationTests/appActions"
import { AsyncReturnType } from "../types/AsyncReturnType.interface"
import { createApp, sleep } from "../utils"
import logger from '../logger'
import { assertReceivedChannelAndSubscribe, registerUsername, waitForExpect } from "./helper"
const log = logger('bot')


function getRandomInt(min: number, max: number) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min) + min);
}
let apps: Map<string, AsyncReturnType<typeof createApp>> = new Map()
const timeout = 120_000
const channelName = 'bot-spam-2'


const createBots = async () => {
  for (let i=0; i < 3; i++) {
    apps.set(`bot_${(Math.random() + 1).toString(36).substring(7)}`, await createApp())
  }
}

const registerBots = async () => {
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
      assert.ok(store.getState().Identity.identities.entities[communityId].userCertificate)
    }, timeout)
    await assertReceivedChannelAndSubscribe(username, channelName, 120_000, store)
  }
}

const sendMessages = async () => {
  const allMessagesCount = 5
  const messagesPerUser = Math.floor(allMessagesCount / apps.size)
  
  const messagesToSend = new Map()
  for (const [username, _app] of apps) {
    messagesToSend.set(username, messagesPerUser)
  }

  while (messagesToSend.size > 0) {
    const usernames = Array.from(messagesToSend.keys())
    const currentUsername = usernames[Math.floor(Math.random() * usernames.length)]
    const messagesLeft = messagesToSend.get(currentUsername)
    
    if (messagesLeft - 1 === 0) {
      await sendMessageWithLatency(currentUsername, apps.get(currentUsername).store, 'Bye!')
      messagesToSend.delete(currentUsername)
      log(`User ${currentUsername} is finished with sending messages`)
      continue
    }

    await sendMessageWithLatency(currentUsername, apps.get(currentUsername).store, `(${messagesLeft}) What's up?`)
    messagesToSend.set(currentUsername, messagesLeft - 1)
  }

  await sleep(10_000)
}


async function sendMessageWithLatency(username: string, store, message: string) {
  const userTypingTime = getRandomInt(5000, 10_000)
  log(`${username} is waiting ${userTypingTime}ms to send a message`)
  await sleep(userTypingTime)
  await sendMessage({
    message,
    channelName,
    store: store
  })
}


const run = async () => {
  await createBots()
  await registerBots()
  await sendMessages()
}

run().then(() => console.log('FINISHED')).catch((e) => console.error(e))
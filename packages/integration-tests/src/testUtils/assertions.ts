import { publicChannels, Store } from '@quiet/nectar';
import assert from 'assert';
import logger from '../logger';
import { waitForExpect } from './waitForExpect';
const log = logger('utils')

const assertContains = (value: any, container: any[]) => {
  if (container.includes(value)) return
  throw assert.fail(`${container} does not contain ${value}`)
}

export async function assertReceivedChannelAndSubscribe(
  userName: string,
  channelName: string,
  maxTime: number = 60000,
  store: Store
) {
  log(`User ${userName} starts waiting ${maxTime}ms for channels`)

  const communityId = store.getState().Communities.communities.ids[0] as string
  
  await waitForExpect(() => {
    assertContains(channelName, store.getState().PublicChannels.channels.entities[communityId].channels.ids)
  }, maxTime)
  log(`User ${userName} replicated '${channelName}'`)

  store.dispatch(
    publicChannels.actions.setCurrentChannel({
      communityId,
      channelAddress: store.getState().PublicChannels.channels.entities[communityId]
        .channels.ids[0] as string
    })
  )

  store.dispatch(publicChannels.actions.subscribeToAllTopics(communityId))

  log(
    `User ${userName} received ${store.getState().PublicChannels.channels.entities[communityId].channels
      .ids.length
    } channels`
  )
}

export async function assertReceivedMessages(
  userName: string,
  expectedCount: number,
  maxTime: number = 60000,
  store: Store
) {
  log(`User ${userName} starts waiting ${maxTime}ms for messages`)

  const communityId = store.getState().Communities.communities.ids[0]

  await waitForExpect(() => {
    assert.strictEqual(
      store.getState().PublicChannels.channels.entities[communityId].channelMessages.ids.length, expectedCount
    )
  }, maxTime)
  
  log(
    `User ${userName} received ${store.getState().PublicChannels.channels.entities[communityId]
      .channelMessages.ids.length
    } messages`
  )
}

export const assertReceivedMessagesMatch = (
  userName: string,
  messages: string[],
  store: Store
) => {  
  const communityId = store.getState().Communities.communities.ids[0]

  const receivedMessagesEntities = Object.values(
    store.getState().PublicChannels.channels.entities[communityId]
      .channelMessages.entities
  )

  const receivedMessages = receivedMessagesEntities.map(msg => msg.message)

  const matchingMessages = []
  for (const message of messages) {
    if (receivedMessages.includes(message)) {
      matchingMessages.push(message)
    }
  }

  assert.strictEqual(
    matchingMessages.length, messages.length, `Messages for ${userName} don't match. Was looking for ${messages}, found ${receivedMessages}`
  )
}

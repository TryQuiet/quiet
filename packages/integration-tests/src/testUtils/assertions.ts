import { publicChannels, Store } from '@quiet/state-manager'
import assert from 'assert'
import logger from '../logger'
import { MAIN_CHANNEL } from './constants'
import { waitForExpect } from './waitForExpect'
const log = logger('utils')

const timeout = 500_000

const assertContains = (value: any, container: any[]) => {
  if (container.includes(value)) return
  assert.fail(`${container} does not contain ${value}`)
}

const assertNotEmpty = (value: any) => {
  assert.notEqual(value, undefined)
  assert.notEqual(value, null)
  assert.notEqual(value, [])
  assert.notEqual(value, {})
}

export async function assertReceivedChannel(
  userName: string,
  channelName: string,
  maxTime: number = timeout,
  store: Store
) {
  log(`User ${userName} starts waiting ${maxTime}ms for channels`)

  await waitForExpect(() => {
    assertNotEmpty(store.getState().PublicChannels)
    assertContains(channelName, store.getState().PublicChannels.channels.ids)
  }, maxTime)
  log(`User ${userName} replicated '${channelName}'`)

  store.dispatch(
    publicChannels.actions.setCurrentChannel({
      channelAddress: store.getState().PublicChannels.channels.ids[0] as string
    })
  )

  log(`User ${userName} received ${store.getState().PublicChannels.channels.ids.length} channels`)
}

export async function assertReceivedMessages(
  userName: string,
  expectedCount: number,
  maxTime: number = timeout,
  store: Store
) {
  log(`User ${userName} starts waiting ${maxTime}ms for messages`)

  await waitForExpect(() => {
    assert.strictEqual(
      store.getState().Messages.publicChannelsMessagesBase.entities[MAIN_CHANNEL].messages.ids
        .length,
      expectedCount
    )
  }, maxTime)

  log(
    `User ${userName} received ${
      store.getState().Messages.publicChannelsMessagesBase.entities[MAIN_CHANNEL].messages.ids
        .length
    } messages`
  )
}

export const assertReceivedMessagesMatch = (userName: string, messages: string[], store: Store) => {
  const receivedMessagesEntities = Object.values(
    store.getState().Messages.publicChannelsMessagesBase.entities[MAIN_CHANNEL].messages.entities
  )

  const receivedMessages = receivedMessagesEntities.map((msg) => msg.message)

  const matchingMessages = []
  for (const message of messages) {
    if (receivedMessages.includes(message)) {
      matchingMessages.push(message)
    }
  }

  assert.strictEqual(
    matchingMessages.length,
    messages.length,
    `Messages for ${userName} don't match. Was looking for ${messages}, found ${receivedMessages}`
  )
}

export const assertConnectedToPeers = async (store: Store, count: number) => {
  await waitForExpect(() => {
    assert.strictEqual(store.getState().Network.connectedPeers.ids.length, count)
  }, timeout)
}

export const assertReceivedCertificates = async (
  userName: string,
  expectedCount: number,
  maxTime: number = timeout,
  store: Store
) => {
  log(`User ${userName} starts waiting ${maxTime}ms for certificates`)

  await waitForExpect(() => {
    assert.strictEqual(store.getState().Users.certificates.ids.length, expectedCount)
  }, maxTime)

  log(`User ${userName} received ${store.getState().Users.certificates.ids.length} certificates`)
}

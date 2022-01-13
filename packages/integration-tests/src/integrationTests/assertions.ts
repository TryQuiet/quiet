import waitForExpect from 'wait-for-expect'
import { publicChannels } from '@zbayapp/nectar'
import { AsyncReturnType } from '../types/AsyncReturnType.interface'
import { createApp, sleep } from '../utils'
import logger from '../logger'

const log = logger()

const App: AsyncReturnType<typeof createApp> = null
type Store = typeof App.store

export async function assertReceivedCertificates(
  userName: string,
  expectedCount: number,
  maxTime: number = 60000,
  store: Store
) {
  log(`User ${userName} starts waiting ${maxTime}ms for certificates`)

  await waitForExpect(() => {
    expect(store.getState().Users.certificates.ids).toHaveLength(expectedCount)
  }, maxTime)

  log(
    `User ${userName} received ${store.getState().Users.certificates.ids.length
    } certificates`
  )
}

export async function assertReceivedChannelsAndSubscribe(
  userName: string,
  expectedCount: number,
  maxTime: number = 60000,
  store: Store
) {
  log(`User ${userName} starts waiting ${maxTime}ms for channels`)

  const communityId = store.getState().Communities.communities.ids[0] as string

  await waitForExpect(() => {
    expect(
      store.getState().PublicChannels.channels.entities[communityId].channels
        .ids
    ).toHaveLength(expectedCount)
  }, maxTime)

  store.dispatch(
    publicChannels.actions.setCurrentChannel({
      communityId,
      channel: store.getState().PublicChannels.channels.entities[communityId]
        .channels.ids[0] as string
    })
  )

  store.dispatch(publicChannels.actions.subscribeForAllTopics(communityId))

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
    expect(
      store.getState().PublicChannels.channels.entities[communityId]
        .channelMessages.ids
    ).toHaveLength(expectedCount)
  }, maxTime)
  log(
    `User ${userName} received ${store.getState().PublicChannels.channels.entities[communityId]
      .channelMessages.ids.length
    } messages`
  )
}

export const assertReceivedMessagesAreValid = async (
  userName: string,
  messages: any[],
  maxTime: number = 60000,
  store: Store
) => {
  log(`User ${userName} checks is messages are valid`)

  const communityId = store.getState().Communities.communities.ids[0]

  const receivedMessages = Object.values(
    store.getState().PublicChannels.channels.entities[communityId]
      .channelMessages.entities
  )

  const validMessages = []

  for (const receivedMessage of receivedMessages) {
    const msg = messages.filter(
      (message) => message.publicKey === receivedMessage.pubKey
    )
    if (msg[0]) {
      validMessages.push(msg[0])
    }
  }

  await waitForExpect(() => {
    expect(validMessages).toHaveLength(messages.length)
  }, maxTime)
}

export const assertInitializedExistingCommunitiesAndRegistrars = async (
  store: Store
) => {
  const communityId = store.getState().Communities.communities.ids[0]

  await waitForExpect(() => {
    expect(
      store.getState().Connection.initializedCommunities[communityId]
    ).toBeTruthy()
  })
  await waitForExpect(() => {
    expect(
      store.getState().Connection.initializedRegistrars[communityId]
    ).toBeTruthy()
  })
}

export const assertReceivedRegistrationError = async (store: Store) => {
  const communityId = store.getState().Communities.communities.ids[0]
  await waitForExpect(() => {
    expect(store.getState().Errors[communityId]?.ids[0]).toEqual('registrar')
  }, 20_000)
}

export const assertReceivedCertificate = async (store: Store) => {
  const communityId = store.getState().Communities.communities.ids[0]
  await waitForExpect(() => {
    expect(
      store.getState().Identity.identities.entities[communityId].userCertificate
    ).toBeTruthy()
  }, 150_000)
}

export const assertConnectedToPeers = async (
  store: Store,
  count: number
) => {
  // const communityId = store.getState().Communities.communities.ids[0]
  await sleep(10_000)
  log('peeeeers', store.getState().Connection.connectedPeers)

  await waitForExpect(() => {
    expect(
      store.getState().Connection.connectedPeers.length
    ).toEqual(count)

  }, 60_000)

}
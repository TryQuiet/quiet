import { ErrorPayload, publicChannels, SocketActionTypes } from '@quiet/nectar'
import waitForExpect from 'wait-for-expect'
import logger from '../logger'
import { AsyncReturnType } from '../types/AsyncReturnType.interface'
import { createApp, sleep } from '../utils'

const log = logger('assertions')

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

export const assertReceivedRegistrationError = async (store: Store, error?: ErrorPayload) => {
  await waitForExpect(() => {
    expect(store.getState().Errors.errors?.ids[0]).toEqual(SocketActionTypes.REGISTRAR)
  }, 20_000)
  if (error) {
    await waitForExpect(() => {
      expect(store.getState().Errors.errors?.entities[SocketActionTypes.REGISTRAR]).toStrictEqual(error)
    }, 20_000)
  }
}

export const assertNoRegistrationError = async(store: Store) => {
  await waitForExpect(() => {
    expect(store.getState().Errors.errors?.ids.includes('registrar')).toBe(false)
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
  await sleep(10_000)
  await waitForExpect(() => {
    expect(
      store.getState().Connection.connectedPeers.ids.length
    ).toEqual(count)
  }, 20_000)
}

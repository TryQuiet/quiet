import { ErrorPayload, publicChannels, SocketActionTypes, TestStore, messages } from '@quiet/nectar'
import waitForExpect from 'wait-for-expect'
import logger from '../logger'
import { AsyncReturnType } from '../types/AsyncReturnType.interface'
import { createApp, sleep } from '../utils'

const log = logger('assertions')

export async function assertReceivedCertificates(
  userName: string,
  expectedCount: number,
  maxTime: number = 60000,
  store: TestStore
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
  store: TestStore
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

  store.dispatch(publicChannels.actions.subscribeToAllTopics())

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
  store: TestStore
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
  store: TestStore
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
      (message) => message.signature === receivedMessage.signature
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
  store: TestStore
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

export const assertReceivedRegistrationError = async (store: TestStore, error?: ErrorPayload) => {
  await waitForExpect(() => {
    expect(store.getState().Errors.errors?.ids[0]).toEqual(SocketActionTypes.REGISTRAR)
  }, 20_000)
  if (error) {
    await waitForExpect(() => {
      expect(store.getState().Errors.errors?.entities[SocketActionTypes.REGISTRAR]).toStrictEqual(error)
    }, 20_000)
  }
}

export const assertNoRegistrationError = async(store: TestStore) => {
  await waitForExpect(() => {
    expect(store.getState().Errors.errors?.ids.includes('registrar')).toBe(false)
  }, 20_000)
}

export const assertReceivedCertificate = async (store: TestStore) => {
  const communityId = store.getState().Communities.communities.ids[0]
  await waitForExpect(() => {
    expect(
      store.getState().Identity.identities.entities[communityId].userCertificate
    ).toBeTruthy()
  }, 150_000)
}

export const assertConnectedToPeers = async (
  store: TestStore,
  count: number
) => {
  await sleep(10_000)
  await waitForExpect(() => {
    expect(
      store.getState().Connection.connectedPeers.ids.length
    ).toEqual(count)
  }, 20_000)
}

export const assertStoreStatesAreEqual = async (oldState, currentState) => {
  
  const oldStateWithLastConnectedTimeFromCurrentState = {
    ...oldState,
    Connection: {
      ...oldState.Connection,
      lastConnectedTime: currentState.Connection.lastConnectedTime
    },
  }

  expect(currentState).toMatchObject(oldStateWithLastConnectedTimeFromCurrentState)
}

export const assertInitializedCommunity = async (store: TestStore) => {
  await waitForExpect(() => {
    // This is the last action when initializing community.
    expect(store.getState().LastAction.type).toEqual(messages.actions.addMessageVerificationStatus.type)
  }, 300_000)
}

export const assertRegistrationRequestSent = async (store: TestStore, count: number) => {
  const communityId = store.getState().Communities.communities.ids[0]
  await waitForExpect(() => {
    expect(store.getState().Communities.communities.entities[communityId].registrationAttempts).toEqual(count)
  }, 240_000)
}

export const assertReceivedOldCertificate = async (store: TestStore) => {
  const communityId = store.getState().Communities.communities.ids[0]

  await waitForExpect(() => {
    expect(
      store.getState().LastAction?.payload?.userCertificate
    ).toEqual(store.getState().Identity.identities.entities[communityId].userCertificate
    )
  }, 300_000)
}
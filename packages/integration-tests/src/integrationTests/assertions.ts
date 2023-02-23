import { ErrorPayload, publicChannels, SocketActionTypes, TestStore, messages, MessageType } from '@quiet/state-manager'
import waitForExpect from 'wait-for-expect'
import { MAIN_CHANNEL } from '../testUtils/constants'
import { sleep } from '../utils'
import logger from '../logger'

const log = logger('assertions')

export async function assertReceivedCertificates(
  userName: string,
  expectedCount: number,
  maxTime: number = 80000,
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

  await waitForExpect(() => {
    expect(
      store.getState().PublicChannels.channels.ids
    ).toHaveLength(expectedCount)
  }, maxTime)

  store.dispatch(
    publicChannels.actions.setCurrentChannel({
      channelAddress: store.getState().PublicChannels.channels.ids[0] as string
    })
  )

  log(
    `User ${userName} received ${store.getState().PublicChannels.channels.ids.length
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

  await waitForExpect(() => {
    expect(
      store.getState().Messages.publicChannelsMessagesBase.entities[MAIN_CHANNEL].messages.ids
    ).toHaveLength(expectedCount)
  }, maxTime)
  log(
    `User ${userName} received ${store.getState().Messages.publicChannelsMessagesBase.entities[MAIN_CHANNEL].messages.ids.length
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

  const receivedMessages = Object.values(
    store.getState().Messages.publicChannelsMessagesBase.entities[MAIN_CHANNEL].messages.entities
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

export async function assertReceivedImages(
  userName: string,
  expectedCount: number,
  maxTime: number = 60000,
  store: TestStore
) {
  log(`User ${userName} starts waiting ${maxTime}ms for image`)
  await waitForExpect(() => {
    expect(
      Object.values(
        store.getState().Messages.publicChannelsMessagesBase.entities[MAIN_CHANNEL].messages.entities
      ).filter(message => message.type === MessageType.Image)
    ).toHaveLength(expectedCount)
  }, maxTime)
  log(
    `User ${userName} received ${
      Object.values(
        store.getState().Messages.publicChannelsMessagesBase.entities[MAIN_CHANNEL].messages.entities
      ).filter(message => message.type === MessageType.Image).length
    } images`
  )
}

export async function assertDownloadedImage(
  userName: string,
  expectedImage: string, // filename.ext
  maxTime: number = 60000,
  store: TestStore
) {
  log(`User ${userName} starts waiting ${maxTime}ms for downloading ${expectedImage}`)
  await waitForExpect(() => {
    const message = Object.values(
      store.getState().Messages.publicChannelsMessagesBase.entities[MAIN_CHANNEL].messages.entities
    ).filter(message => message.media?.path)[0]

    const path = message.media.path.split('/')
    const filename = path[path.length - 1]

    expect(filename).toBe(expectedImage)
  }, maxTime)
  log(
    `User ${userName} downloaded ${expectedImage}`
  )
}

export const assertInitializedExistingCommunitiesAndRegistrars = async (
  store: TestStore
) => {
  const communityId = store.getState().Communities.communities.ids[0]

  await waitForExpect(() => {
    expect(
      store.getState().Network.initializedCommunities[communityId]
    ).toBeTruthy()
  })
  // why two times ?
  // await waitForExpect(() => {
  //   expect(
  //     store.getState().Network.initializedRegistrars[communityId]
  //   ).toBeTruthy()
  // })
}

export const assertReceivedRegistrationError = async (store: TestStore, error?: ErrorPayload) => {
  await waitForExpect(() => {
    expect(store.getState().Errors.errors?.ids[0]).toEqual(SocketActionTypes.REGISTRAR)
  }, 300_000)
  if (error) {
    await waitForExpect(() => {
      expect(store.getState().Errors.errors?.entities[SocketActionTypes.REGISTRAR]).toStrictEqual(error)
    }, 300_000)
  }
}

export const assertNoRegistrationError = async(store: TestStore) => {
  await waitForExpect(() => {
    expect(store.getState().Errors.errors?.ids.includes('registrar')).toBe(false)
  }, 300_000)
}

export const assertReceivedCertificate = async (store: TestStore) => {
  const communityId = store.getState().Communities.communities.ids[0]
  await waitForExpect(() => {
    expect(
      store.getState().Identity.identities.entities[communityId].userCertificate
    ).toBeTruthy()
  }, 300_000)
}

export const assertConnectedToPeers = async (
  store: TestStore,
  count: number
) => {
  await sleep(10_000)
  await waitForExpect(() => {
    expect(
      store.getState().Network.connectedPeers.ids.length
    ).toEqual(count)
  }, 20_000)
}

export const assertStoreStatesAreEqual = async (oldState, currentState) => {
  const oldStateWithLastConnectedTimeFromCurrentState = {
    ...oldState,
    Connection: {
      ...oldState.Connection,
      lastConnectedTime: currentState.Connection.lastConnectedTime,
      uptime: currentState.Connection.uptime
    }
  }

  expect(currentState).toMatchObject(oldStateWithLastConnectedTimeFromCurrentState)
}

export const assertInitializedCommunity = async (store: TestStore) => {
  await waitForExpect(() => {
    // This is the last action when initializing community.
    expect(store.getState().LastAction.includes(messages.actions.addMessageVerificationStatus.type))
  }, 300_000)
}

export const assertRegistrationRequestSent = async (store: TestStore, count: number) => {
  const communityId = store.getState().Communities.communities.ids[0]
  await waitForExpect(() => {
    expect(store.getState().Communities.communities.entities[communityId].registrationAttempts).toEqual(count)
  }, 300_000)
}

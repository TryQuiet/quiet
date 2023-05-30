import waitForExpect from 'wait-for-expect'
import {
  network,
  identity,
  communities,
  publicChannels,
  messages,
  files,
  CreateNetworkPayload,
  CommunityOwnership,
  RegisterCertificatePayload,
  ChannelMessage,
  MessageType,
  FileContent,
  TestStore
} from '@quiet/state-manager'
import { createApp } from '../utils'
import { AsyncReturnType } from '../types/AsyncReturnType.interface'

import logger from '../logger'

const log = logger('actions')

const App: AsyncReturnType<typeof createApp> = null
type Store = typeof App.store

interface CreateCommunity {
  userName: string
  store: TestStore
}

export interface JoinCommunity {
  registrarAddress: string
  userName: string
  ownerPeerId: string
  ownerRootCA: string
  expectedPeersCount: number
  registrarPort: number
  store: TestStore
}

export interface Register {
  registrarAddress: string
  userName: string
  registrarPort?: number
  store: TestStore
}

interface SendRegistrationRequest {
  registrarAddress: string
  userName: string
  store: TestStore
  registrarPort?: number
}

export interface OwnerData {
  registrarAddress: string
  communityId: string
  ownerPeerId: string
  ownerRootCA: string
  registrarPort: number
}

export interface SendMessage {
  message: string
  channelName?: string
  store: TestStore
}

export interface SendImage {
  file: FileContent
  store: TestStore
}

export async function createCommunity({ userName, store }: CreateCommunity) {
  const timeout = 50_000
  const communityName = 'CommunityName'

  const createNetworkPayload: CreateNetworkPayload = {
    ownership: CommunityOwnership.Owner,
    name: communityName
  }

  store.dispatch(communities.actions.createNetwork(createNetworkPayload))

  await waitForExpect(() => {
    expect(store.getState().Identity.identities.ids).toHaveLength(1)
  }, timeout)
  await waitForExpect(() => {
    expect(store.getState().Communities.communities.ids).toHaveLength(1)
  }, timeout)

  const communityId = store.getState().Communities.communities.ids[0]

  await waitForExpect(() => {
    expect(
      store.getState().Identity.identities.entities[communityId].hiddenService.onionAddress
    ).toBeTruthy()
  }, timeout)
  await waitForExpect(() => {
    expect(store.getState().Identity.identities.entities[communityId].peerId.id).toHaveLength(46)
  }, timeout)

  store.dispatch(identity.actions.registerUsername(userName))

  await waitForExpect(() => {
    expect(store.getState().Identity.identities.entities[communityId].userCertificate).toBeTruthy()
  }, timeout)
  await waitForExpect(() => {
    expect(store.getState().Communities.communities.entities[communityId].CA).toHaveProperty(
      'rootObject'
    )
  }, timeout)

  // regirstral url zamiast oniona
  await waitForExpect(() => {
    expect(store.getState().Communities.communities.entities[communityId].registrarUrl).toBeTruthy()
  }, timeout)

  await waitForExpect(() => {
    expect(store.getState().Users.certificates.ids).toHaveLength(1)
  }, timeout)
  await waitForExpect(() => {
    expect(store.getState().Network.initializedCommunities[communityId]).toBeTruthy()
  }, timeout)
  log('initializedCommunity', store.getState().Network.initializedCommunities[communityId])

  // after connections manager refactoring this is no longer in redux
  // await waitForExpect(() => {
  //   expect(
  //     store.getState().Network.initializedRegistrars[communityId]
  //   ).toBeTruthy()
  // }, timeout)
}

export async function registerUsername(payload: Register) {
  const { registrarAddress, userName, registrarPort, store } = payload

  // Give it a huge timeout, it should never fail, but sometimes takes more time, depending on tor.
  const timeout = 6_000_000

  let address: string
  if (payload.registrarAddress === '0.0.0.0') {
    address = `http://${registrarAddress}:${registrarPort}`
  } else {
    address = `${registrarAddress}`
  }

  const createNetworkPayload: CreateNetworkPayload = {
    ownership: CommunityOwnership.User,
    registrar: address
  }

  store.dispatch(communities.actions.createNetwork(createNetworkPayload))

  await waitForExpect(() => {
    expect(store.getState().Identity.identities.ids).toHaveLength(1)
  }, timeout)
  await waitForExpect(() => {
    expect(store.getState().Communities.communities.ids).toHaveLength(1)
  }, timeout)

  const communityId = store.getState().Communities.communities.ids[0]

  await waitForExpect(() => {
    expect(
      store.getState().Identity.identities.entities[communityId].hiddenService.onionAddress
    ).toBeTruthy()
  }, timeout)
  await waitForExpect(() => {
    expect(store.getState().Identity.identities.entities[communityId].peerId.id).toHaveLength(46)
  }, timeout)

  store.dispatch(identity.actions.registerUsername(userName))
}

export async function sendCsr(store: TestStore) {
  const communityId = store.getState().Communities.communities.ids[0] as string
  const nickname = store.getState().Identity.identities.entities[communityId].nickname
  const userCsr = store.getState().Identity.identities.entities[communityId].userCsr

  const csr: RegisterCertificatePayload = {
    communityId,
    nickname: nickname,
    userCsr
  }

  store.dispatch(identity.actions.registerCertificate(csr))
}

export async function joinCommunity(payload: JoinCommunity) {
  const { ownerPeerId, ownerRootCA, expectedPeersCount, store } = payload

  const timeout = 5000_000

  await registerUsername(payload)
  const communityId = store.getState().Communities.communities.ids[0]
  console.log({ communityId })

  const userPeerId = store.getState().Identity.identities.entities[communityId].peerId.id

  console.log(store.getState().Identity.identities.entities[communityId])
  console.log(store.getState().Communities.communities.entities[communityId])
  await waitForExpect(() => {
    expect(store.getState().Identity.identities.entities[communityId].userCertificate).toBeTruthy()
  }, timeout)
  console.log('joinCommunity-1')
  await waitForExpect(() => {
    expect(store.getState().Communities.communities.entities[communityId].rootCa).toEqual(
      ownerRootCA
    )
  }, timeout)
  console.log('joinCommunity-2')
  await waitForExpect(() => {
    expect(store.getState().Communities.communities.entities[communityId].peerList.length).toEqual(
      expectedPeersCount
    )
  }, timeout)
  console.log('joinCommunity-3')
  const peerList = store.getState().Communities.communities.entities[communityId].peerList
  console.log({ peerList })
  await waitForExpect(() => {
    expect(peerList[0]).toMatch(new RegExp(ownerPeerId))
  }, timeout)
  console.log('joinCommunity-4')
  await waitForExpect(() => {
    expect(peerList[peerList.length - 1]).toMatch(new RegExp(userPeerId))
  }, timeout)
}

export function getInfoMessages(store: TestStore, channel: string): ChannelMessage[] {
  const messages = Object.values(
    store.getState().Messages.publicChannelsMessagesBase.entities[channel].messages.entities
  )
  console.log('check info messages', messages)
  return messages.filter((message) => message.type === MessageType.Info)
}

export async function sendMessage(payload: SendMessage): Promise<ChannelMessage> {
  const { message, channelName, store } = payload

  const channelEntities = store.getState().PublicChannels.channels.entities
  const generalId = Object.keys(channelEntities).find(
    (key) => channelEntities[key].name === 'general'
  )
  store.dispatch(publicChannels.actions.setCurrentChannel({ channelId: generalId }))

  log(message, 'sendMessage')

  if (channelName) {
    store.dispatch(
      publicChannels.actions.setCurrentChannel({
        channelId: channelName
      })
    )
  }

  store.dispatch(messages.actions.sendMessage({ message }))

  await waitForExpect(() => {
    expect(store.getState().LastAction.includes('Messages/addMessageVerificationStatus'))
  }, 5000)

  const entities = Array.from(
    Object.values(
      store.getState().Messages.publicChannelsMessagesBase.entities[generalId].messages.entities
    )
  )

  const newMessage = entities.filter((m) => {
    return m.message === message
  })

  return newMessage[0]
}

export async function sendImage(payload: SendImage) {
  const { file, store } = payload

  const entities = store.getState().PublicChannels.channels.entities
  const generalId = Object.keys(entities).find((key) => entities[key].name === 'general')
  store.dispatch(publicChannels.actions.setCurrentChannel({ channelId: generalId }))

  log(JSON.stringify(payload), 'sendImage')

  store.dispatch(files.actions.uploadFile(file))

  // Result of an action is sending a message containing cid of uploaded image
  await waitForExpect(() => {
    expect(store.getState().LastAction.includes('Messages/addMessageVerificationStatus'))
  }, 5000)
}

export const getCommunityOwnerData = (ownerStore: Store) => {
  const ownerStoreState = ownerStore.getState()
  const community =
    ownerStoreState.Communities.communities.entities[ownerStoreState.Communities.currentCommunity]
  const registrarAddress = community.registrarUrl
  const ownerIdentityState = ownerStore.getState().Identity
  return {
    registrarAddress,
    communityId: community.id,
    ownerPeerId:
      ownerIdentityState.identities.entities[ownerIdentityState.identities.ids[0]].peerId.id,
    ownerRootCA: community.rootCa,
    registrarPort: community.port
  }
}

export const clearInitializedCommunitiesAndRegistrars = (store: TestStore) => {
  store.dispatch(network.actions.removeInitializedCommunities)
  store.dispatch(network.actions.removeInitializedRegistrars)
}

export const sendRegistrationRequest = async (payload: SendRegistrationRequest) => {
  const { registrarAddress, userName, registrarPort, store } = payload

  const timeout = 900_000

  let address: string
  if (registrarAddress === '0.0.0.0') {
    address = `${registrarAddress}:${registrarPort}`
  } else {
    address = `${registrarAddress}`
  }

  const createNetworkPayload: CreateNetworkPayload = {
    ownership: CommunityOwnership.User,
    name: payload.userName,
    registrar: address
  }

  store.dispatch(communities.actions.createNetwork(createNetworkPayload))

  await waitForExpect(() => {
    expect(store.getState().Identity.identities.ids).toHaveLength(1)
  }, timeout)
  await waitForExpect(() => {
    expect(store.getState().Communities.communities.ids).toHaveLength(1)
  }, timeout)

  const communityId = store.getState().Communities.communities.ids[0]

  await waitForExpect(() => {
    expect(
      store.getState().Identity.identities.entities[communityId].hiddenService.onionAddress
    ).toBeTruthy()
  }, timeout)
  await waitForExpect(() => {
    expect(store.getState().Identity.identities.entities[communityId].peerId.id).toHaveLength(46)
  }, timeout)

  store.dispatch(identity.actions.registerUsername(userName))
}

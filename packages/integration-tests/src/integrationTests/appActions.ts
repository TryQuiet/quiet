import waitForExpect from 'wait-for-expect'
import {
  identity,
  communities,
  messages,
  files,
  connection,
  publicChannels,
  RegisterCertificatePayload,
  CreateNetworkPayload,
  CommunityOwnership,
  TestStore,
  ChannelMessage,
  FileContent,
  network,
} from '@quiet/state-manager'
import { MAIN_CHANNEL } from '../testUtils/constants'
import { AsyncReturnType } from '../types/AsyncReturnType.interface'
import { createApp } from '../utils'
import logger from '../logger'

const log = logger('actions')

const App: AsyncReturnType<typeof createApp> = null
type Store = typeof App.store

interface CreateCommunity {
  userName: string
  store: Store
}

export interface JoinCommunity {
  registrarAddress: string
  userName: string
  ownerPeerId: string
  ownerRootCA: string
  expectedPeersCount: number
  registrarPort: number
  store: Store
}

export interface Register {
  registrarAddress: string
  userName: string
  registrarPort?: number
  store: Store
}

interface SendRegistrationRequest {
  registrarAddress: string
  userName: string
  store: Store
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
  const timeout = 20_000
  const communityName = 'CommunityName'

  const createNetworkPayload: CreateNetworkPayload = {
    ownership: CommunityOwnership.Owner,
    name: communityName,
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
    expect(store.getState().Identity.identities.entities[communityId].hiddenService.onionAddress).toBeTruthy()
  }, timeout)
  await waitForExpect(() => {
    expect(store.getState().Identity.identities.entities[communityId].peerId.id).toHaveLength(46)
  }, timeout)

  store.dispatch(identity.actions.registerUsername({ nickname: userName }))

  await waitForExpect(() => {
    expect(store.getState().Identity.identities.entities[communityId].userCertificate).toBeTruthy()
  }, timeout)
  await waitForExpect(() => {
    expect(store.getState().Communities.communities.entities[communityId].CA).toHaveProperty('rootObject')
  }, timeout)
  await waitForExpect(() => {
    expect(store.getState().Communities.communities.entities[communityId].onionAddress).toBeTruthy()
  }, timeout)
  log(store.getState().Communities.communities.entities[communityId].onionAddress)
  await waitForExpect(() => {
    expect(store.getState().Users.certificates.ids).toHaveLength(1)
  }, timeout)
  await waitForExpect(() => {
    expect(store.getState().Network.initializedCommunities[communityId]).toBeTruthy()
  }, timeout)
  log('initializedCommunity', store.getState().Network.initializedCommunities[communityId])
}

export async function registerUsername(payload: Register) {
  const { userName, store } = payload

  // Give it a huge timeout, it should never fail, but sometimes takes more time, depending on tor.
  const timeout = 600_000

  const createNetworkPayload: CreateNetworkPayload = {
    ownership: CommunityOwnership.User,
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
    expect(store.getState().Identity.identities.entities[communityId].hiddenService.onionAddress).toBeTruthy()
  }, timeout)
  await waitForExpect(() => {
    expect(store.getState().Identity.identities.entities[communityId].peerId.id).toHaveLength(46)
  }, timeout)

  store.dispatch(identity.actions.registerUsername({ nickname: userName }))
}

export async function sendCsr(store: Store) {
  const communityId = store.getState().Communities.communities.ids[0] as string
  const nickname = store.getState().Identity.identities.entities[communityId].nickname
  const userCsr = store.getState().Identity.identities.entities[communityId].userCsr

  const csr: RegisterCertificatePayload = {
    communityId,
    nickname: nickname,
    userCsr,
  }

  store.dispatch(identity.actions.registerCertificate(csr))
}

export async function joinCommunity(payload: JoinCommunity) {
  const { ownerPeerId, ownerRootCA, expectedPeersCount, store } = payload

  const timeout = 600_000

  await registerUsername(payload)

  const communityId = store.getState().Communities.communities.ids[0]
  const userPeerId = store.getState().Identity.identities.entities[communityId].peerId.id

  await waitForExpect(() => {
    expect(store.getState().Identity.identities.entities[communityId].userCertificate).toBeTruthy()
  }, timeout)

  await waitForExpect(() => {
    expect(store.getState().Communities.communities.entities[communityId].rootCa).toEqual(ownerRootCA)
  }, timeout)

  await waitForExpect(() => {
    expect(store.getState().Communities.communities.entities[communityId].peerList.length).toEqual(expectedPeersCount)
  }, timeout)

  const peerList = store.getState().Communities.communities.entities[communityId].peerList

  await waitForExpect(() => {
    expect(peerList[0]).toMatch(new RegExp(ownerPeerId))
  }, timeout)

  await waitForExpect(() => {
    expect(peerList[peerList.length - 1]).toMatch(new RegExp(userPeerId))
  }, timeout)
}

export async function sendMessage(payload: SendMessage): Promise<ChannelMessage> {
  const { message, channelName, store } = payload

  log(message, 'sendMessage')
  const communityId = store.getState().Communities.communities.ids[0]

  if (channelName) {
    store.dispatch(
      publicChannels.actions.setCurrentChannel({
        channelId: channelName,
      })
    )
  }

  store.dispatch(messages.actions.sendMessage({ message }))

  await waitForExpect(() => {
    expect(store.getState().LastAction.includes('Messages/addMessageVerificationStatus'))
  }, 5000)

  const entities = Array.from(
    Object.values(store.getState().Messages.publicChannelsMessagesBase.entities[MAIN_CHANNEL].messages.entities)
  )

  const newMessage = entities.filter(m => {
    return m.message === message
  })

  return newMessage[0]
}

export async function sendImage(payload: SendImage) {
  const { file, store } = payload

  log(JSON.stringify(payload), 'sendImage')

  store.dispatch(files.actions.uploadFile(file))

  // Result of an action is sending a message containing cid of uploaded image
  await waitForExpect(() => {
    expect(store.getState().LastAction.includes('Messages/addMessageVerificationStatus'))
  }, 5000)
}

export const getCommunityOwnerData = (ownerStore: Store) => {
  const ownerStoreState = ownerStore.getState()
  const community = ownerStoreState.Communities.communities.entities[ownerStoreState.Communities.currentCommunity]
  const registrarAddress = community.onionAddress
  const ownerIdentityState = ownerStore.getState().Identity
  return {
    registrarAddress,
    communityId: community.id,
    ownerPeerId: ownerIdentityState.identities.entities[ownerIdentityState.identities.ids[0]].peerId.id,
    ownerRootCA: community.rootCa,
    registrarPort: community.port,
  }
}

export const clearInitializedCommunitiesAndRegistrars = (store: Store) => {
  store.dispatch(network.actions.removeInitializedCommunities)
}

export const sendRegistrationRequest = async (payload: SendRegistrationRequest) => {
  const { userName, store } = payload

  const timeout = 600_000

  const createNetworkPayload: CreateNetworkPayload = {
    ownership: CommunityOwnership.User,
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
    expect(store.getState().Identity.identities.entities[communityId].hiddenService.onionAddress).toBeTruthy()
  }, timeout)
  await waitForExpect(() => {
    expect(store.getState().Identity.identities.entities[communityId].peerId.id).toHaveLength(46)
  }, timeout)

  store.dispatch(identity.actions.registerUsername({ nickname: userName }))
}

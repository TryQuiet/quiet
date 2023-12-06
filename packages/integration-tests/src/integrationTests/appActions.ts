import waitForExpect from 'wait-for-expect'
import {
  identity,
  communities,
  messages,
  files,
  publicChannels,
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

  const community = store.getState().Communities.community

  await waitForExpect(() => {
    expect(store.getState().Identity.identity.hiddenService.onionAddress).toBeTruthy()
  }, timeout)
  await waitForExpect(() => {
    expect(store.getState().Identity.identity.peerId.id).toHaveLength(46)
  }, timeout)

  store.dispatch(identity.actions.chooseUsername({ nickname: userName }))

  await waitForExpect(() => {
    expect(store.getState().Identity.identity.userCertificate).toBeTruthy()
  }, timeout)
  await waitForExpect(() => {
    expect(store.getState().Communities.community.CA).toHaveProperty('rootObject')
  }, timeout)
  await waitForExpect(() => {
    expect(store.getState().Communities.community.onionAddress).toBeTruthy()
  }, timeout)
  log(store.getState().Communities.community.onionAddress)
  await waitForExpect(() => {
    expect(store.getState().Users.certificates.ids).toHaveLength(1)
  }, timeout)
  await waitForExpect(() => {
    expect(store.getState().Network.initializedCommunities[community.id]).toBeTruthy()
  }, timeout)
  log('initializedCommunity', store.getState().Network.initializedCommunities[community.id])
  await waitForExpect(() => {
    expect(store.getState().Network.initializedRegistrars[community.id]).toBeTruthy()
  }, timeout)
}

export async function registerUsername(payload: Register) {
  const { registrarAddress, userName, registrarPort, store } = payload

  // Give it a huge timeout, it should never fail, but sometimes takes more time, depending on tor.
  const timeout = 600_000

  let address: string
  if (payload.registrarAddress === '0.0.0.0') {
    address = `${registrarAddress}:${registrarPort}`
  } else {
    address = registrarAddress
  }

  const createNetworkPayload: CreateNetworkPayload = {
    ownership: CommunityOwnership.User,
    registrar: address,
  }

  store.dispatch(communities.actions.createNetwork(createNetworkPayload))

  const community = store.getState().Communities.community

  await waitForExpect(() => {
    expect(store.getState().Identity.identity.hiddenService.onionAddress).toBeTruthy()
  }, timeout)
  await waitForExpect(() => {
    expect(store.getState().Identity.identity.peerId.id).toHaveLength(46)
  }, timeout)

  store.dispatch(identity.actions.chooseUsername({ nickname: userName }))
}

export async function sendCsr(store: Store) {
  store.dispatch(identity.actions.saveUserCsr())
}

export async function joinCommunity(payload: JoinCommunity) {
  const { ownerPeerId, ownerRootCA, expectedPeersCount, store } = payload

  const timeout = 600_000

  await registerUsername(payload)

  const communityId = store.getState().Communities.community.id
  const userPeerId = store.getState().Identity.identity.peerId.id

  await waitForExpect(() => {
    expect(store.getState().Identity.identity.userCertificate).toBeTruthy()
  }, timeout)

  await waitForExpect(() => {
    expect(store.getState().Communities.community.rootCa).toEqual(ownerRootCA)
  }, timeout)

  await waitForExpect(() => {
    expect(store.getState().Communities.community.peerList.length).toEqual(expectedPeersCount)
  }, timeout)

  const peerList = store.getState().Communities.community.peerList

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
  const community = ownerStoreState.Communities.community
  const registrarAddress = community.onionAddress
  const ownerIdentityState = ownerStore.getState().Identity
  return {
    registrarAddress,
    communityId: community.id,
    ownerPeerId: ownerIdentityState.identity.peerId.id,
    ownerRootCA: community.rootCa,
    registrarPort: community.port,
  }
}

export const clearInitializedCommunitiesAndRegistrars = (store: Store) => {
  store.dispatch(network.actions.removeInitializedCommunities)
  store.dispatch(network.actions.removeInitializedRegistrars)
}

export const sendRegistrationRequest = async (payload: SendRegistrationRequest) => {
  const { registrarAddress, userName, registrarPort, store } = payload

  const timeout = 600_000

  let address: string
  if (registrarAddress === '0.0.0.0') {
    address = `${registrarAddress}:${registrarPort}`
  } else {
    address = registrarAddress
  }

  const createNetworkPayload: CreateNetworkPayload = {
    ownership: CommunityOwnership.User,
    registrar: address,
  }

  store.dispatch(communities.actions.createNetwork(createNetworkPayload))

  await waitForExpect(() => {
    expect(store.getState().Identity.identity.hiddenService.onionAddress).toBeTruthy()
  }, timeout)
  await waitForExpect(() => {
    expect(store.getState().Identity.identity.peerId.id).toHaveLength(46)
  }, timeout)

  store.dispatch(identity.actions.chooseUsername({ nickname: userName }))
}

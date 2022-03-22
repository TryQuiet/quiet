import waitForExpect from 'wait-for-expect'
import { identity, communities, messages, connection, publicChannels, RegisterCertificatePayload, CreateNetworkPayload, CommunityOwnership } from '@quiet/nectar'
import { keyFromCertificate, parseCertificate } from '@quiet/identity'
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

interface JoinCommunity {
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
  registrarPort: number
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

interface SendMessage {
  message: string
  channelName?: string
  store: Store
}

export async function createCommunity({ userName, store }: CreateCommunity) {
  const timeout = 20_000
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
      store.getState().Identity.identities.entities[communityId].hiddenService
        .onionAddress
    ).toBeTruthy()
  }, timeout)
  await waitForExpect(() => {
    expect(
      store.getState().Identity.identities.entities[communityId].peerId.id
    ).toHaveLength(46)
  }, timeout)

  store.dispatch(identity.actions.registerUsername(userName))

  await waitForExpect(() => {
    expect(
      store.getState().Identity.identities.entities[communityId].userCertificate
    ).toBeTruthy()
  }, timeout)
  await waitForExpect(() => {
    expect(
      store.getState().Communities.communities.entities[communityId].CA
    ).toHaveProperty('rootObject')
  }, timeout)
  await waitForExpect(() => {
    expect(
      store.getState().Communities.communities.entities[communityId]
        .onionAddress
    ).toBeTruthy()
  }, timeout)
  log(store.getState().Communities.communities.entities[communityId]
    .onionAddress)
  await waitForExpect(() => {
    expect(store.getState().Users.certificates.ids).toHaveLength(1)
  }, timeout)
  await waitForExpect(() => {
    expect(
      store.getState().Connection.initializedCommunities[communityId]
    ).toBeTruthy()
  }, timeout)
  log('initializedCommunity', store.getState().Connection.initializedCommunities[communityId])
  await waitForExpect(() => {
    expect(
      store.getState().Connection.initializedRegistrars[communityId]
    ).toBeTruthy()
  }, timeout)
}

export async function registerUsername(payload: Register) {
  const {
    registrarAddress,
    userName,
    registrarPort,
    store
  } = payload

  const timeout = 120_000

  let address: string
  if (payload.registrarAddress === '0.0.0.0') {
    address = `${registrarAddress}:${registrarPort}`
  } else {
    address = registrarAddress
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
      store.getState().Identity.identities.entities[communityId].hiddenService
        .onionAddress
    ).toBeTruthy()
  }, timeout)
  await waitForExpect(() => {
    expect(
      store.getState().Identity.identities.entities[communityId].peerId.id
    ).toHaveLength(46)
  }, timeout)

  store.dispatch(identity.actions.registerUsername(userName))
}

export async function sendCsr(store: Store) {
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
  const {
    ownerPeerId,
    ownerRootCA,
    expectedPeersCount,
    store
  } = payload

  const timeout = 120_000

  await registerUsername(payload)

  const communityId = store.getState().Communities.communities.ids[0]
  const userPeerId =
    store.getState().Identity.identities.entities[communityId].peerId.id

  await waitForExpect(() => {
    expect(
      store.getState().Identity.identities.entities[communityId].userCertificate
    ).toBeTruthy()
  }, timeout)

  await waitForExpect(() => {
    expect(
      store.getState().Communities.communities.entities[communityId].rootCa
    ).toEqual(ownerRootCA)
  }, timeout)

  await waitForExpect(() => {
    expect(
      store.getState().Communities.communities.entities[communityId].peerList
        .length
    ).toEqual(expectedPeersCount)
  }, timeout)

  const peerList =
    store.getState().Communities.communities.entities[communityId].peerList

  await waitForExpect(() => {
    expect(peerList[0]).toMatch(new RegExp(ownerPeerId))
  }, timeout)

  await waitForExpect(() => {
    expect(peerList[peerList.length - 1]).toMatch(new RegExp(userPeerId))
  }, timeout)
}

export async function sendMessage(
  payload: SendMessage
): Promise<{ message: string; publicKey: string }> {
  const {
    message,
    channelName,
    store
  } = payload

  log(message, 'sendMessage')
  const communityId = store.getState().Communities.communities.ids[0]

  if (channelName) {
    store.dispatch(
      publicChannels.actions.setCurrentChannel({
        channelAddress: channelName,
        communityId: communityId.toString()
      })
    )
  }

  store.dispatch(messages.actions.sendMessage(message))

  const certificate =
    store.getState().Identity.identities.entities[communityId].userCertificate

  const parsedCertificate = parseCertificate(certificate)
  const publicKey = keyFromCertificate(parsedCertificate)

  return {
    message,
    publicKey
  }
}

export const getCommunityOwnerData = (ownerStore: Store) => {
  const ownerStoreState = ownerStore.getState()
  const community =
    ownerStoreState.Communities.communities.entities[
      ownerStoreState.Communities.currentCommunity
    ]
  const registrarAddress = community.onionAddress
  const ownerIdentityState = ownerStore.getState().Identity
  return {
    registrarAddress,
    communityId: community.id,
    ownerPeerId:
      ownerIdentityState.identities.entities[
        ownerIdentityState.identities.ids[0]
      ].peerId.id,
    ownerRootCA: community.rootCa,
    registrarPort: community.port
  }
}

export const clearInitializedCommunitiesAndRegistrars = (store: Store) => {
  store.dispatch(connection.actions.removeInitializedCommunities)
  store.dispatch(connection.actions.removeInitializedRegistrars)
}

export const sendRegistrationRequest = async (
  payload: SendRegistrationRequest
) => {
  const { registrarAddress, userName, registrarPort, store } = payload

  const timeout = 120_000

  let address: string
  if (registrarAddress === '0.0.0.0') {
    address = `${registrarAddress}:${registrarPort}`
  } else {
    address = registrarAddress
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
      store.getState().Identity.identities.entities[communityId].hiddenService
        .onionAddress
    ).toBeTruthy()
  }, timeout)
  await waitForExpect(() => {
    expect(
      store.getState().Identity.identities.entities[communityId].peerId.id
    ).toHaveLength(46)
  }, timeout)

  store.dispatch(identity.actions.registerUsername(userName))
}

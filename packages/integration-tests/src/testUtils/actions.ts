
import { ChannelMessage, communities, CommunityOwnership, CreateNetworkPayload, identity, messages, publicChannels, SocketActionTypes } from '@quiet/nectar'
import assert from 'assert'
import { Register, SendMessage } from '../integrationTests/appActions'
import logger from '../logger'
import { waitForExpect } from './waitForExpect'
const log = logger('actions')

const timeout = 120_000

export async function registerUsername(payload: Register) {
  const {
    registrarAddress,
    userName,
    store
  } = payload

  const createNetworkPayload: CreateNetworkPayload = {
    ownership: CommunityOwnership.User,
    registrar: registrarAddress
  }
  log(`User ${userName} starts creating network`)
  store.dispatch(communities.actions.createNetwork(createNetworkPayload))

  await waitForExpect(() => {
    assert.equal(store.getState().Identity.identities.ids.length, 1)
  }, timeout)
  await waitForExpect(() => {
    assert.equal(store.getState().Communities.communities.ids.length, 1)
  }, timeout)

  const communityId = store.getState().Communities.communities.ids[0]

  await waitForExpect(() => {
    assert.ok(store.getState().Identity.identities.entities[communityId].hiddenService.onionAddress)
  }, timeout)
  await waitForExpect(() => {
    assert.equal(store.getState().Identity.identities.entities[communityId].peerId.id.length, 46)
  }, timeout)

  log(`User ${userName} starts registering username`)
  store.dispatch(identity.actions.registerUsername(userName))

  await retryRegistrationOnError({ store, username: userName, retryCounter: 3 })
}

export const createCommunity = async ({ username, communityName, store }): Promise<string> => {
  const createNetworkPayload: CreateNetworkPayload = {
    ownership: CommunityOwnership.Owner,
    name: communityName
  }

  store.dispatch(communities.actions.createNetwork(createNetworkPayload))
  await waitForExpect(() => {
    assert.strictEqual(store.getState().Identity.identities.ids.length, 1)
  }, timeout)
  await waitForExpect(() => {
    assert.strictEqual(store.getState().Communities.communities.ids.length, 1)
  }, timeout)

  const communityId = store.getState().Communities.communities.ids[0]

  await waitForExpect(() => {
    assert.ok(
      store.getState().Identity.identities.entities[communityId].hiddenService
        .onionAddress
    )
  }, timeout)
  await waitForExpect(() => {
    assert.strictEqual(
      store.getState().Identity.identities.entities[communityId].peerId.id.length, 46
    )
  }, timeout)

  store.dispatch(identity.actions.registerUsername(username))

  await waitForExpect(() => {
    assert.ok(
      store.getState().Identity.identities.entities[communityId].userCertificate
    )
  }, timeout)
  // await waitForExpect(() => {
  //   expect(
  //     store.getState().Communities.communities.entities[communityId].CA
  //   ).toHaveProperty('rootObject')
  // }, timeout)
  await waitForExpect(() => {
    assert.ok(
      store.getState().Communities.communities.entities[communityId]
        .onionAddress
    )
  }, timeout)
  log(store.getState().Communities.communities.entities[communityId].onionAddress)
  await waitForExpect(() => {
    assert.strictEqual(store.getState().Users.certificates.ids.length, 1)
  }, timeout)
  await waitForExpect(() => {
    assert.ok(
      store.getState().Connection.initializedCommunities[communityId]
    )
  }, timeout)
  log('initializedCommunity', store.getState().Connection.initializedCommunities[communityId])
  await waitForExpect(() => {
    assert.ok(
      store.getState().Connection.initializedRegistrars[communityId]
    )
  }, timeout)

  return store.getState().Communities.communities.entities[communityId].onionAddress
}

export async function sendMessage(
  payload: SendMessage
): Promise<ChannelMessage> {
  const {
    message,
    channelName,
    store
  } = payload

  log(message, 'sendMessage')

  store.dispatch(messages.actions.sendMessage({ message }))

  await waitForExpect(() => {
    assert.ok(store.getState().LastAction.includes('Messages/addMessageVerificationStatus'))
  }, 5000)

  const entities = Array.from(Object.values(store.getState().Messages.publicChannelsMessagesBase.entities[channelName].messages.entities))

  const newMessage = entities.filter((m) => {
    return m.message === message
  })

  return newMessage[0]
}

export async function joinCommunity({ registrarAddress, userName, expectedPeersCount, store }) {
  await registerUsername({ registrarAddress, userName, store })

  const communityId = store.getState().Communities.communities.ids[0]
  const userPeerId = store.getState().Identity.identities.entities[communityId].peerId.id

  await waitForExpect(() => {
    assert.ok(
      store.getState().Identity.identities.entities[communityId].userCertificate
    )
  }, timeout)

  await waitForExpect(() => {
    assert.equal(
      store.getState().Communities.communities.entities[communityId].peerList.length, expectedPeersCount
    )
  }, timeout)

  const peerList = store.getState().Communities.communities.entities[communityId].peerList

  await waitForExpect(() => {
    assert.match(peerList[peerList.length - 1], new RegExp(userPeerId))
  }, timeout)
}

export async function retryRegistrationOnError ({ store, username, retryCounter }) {
  /**
   * Simulate user clicking "Register" button when registrar error is displayed (503 error code).
   * The error happens sometimes even though user is usually able to register on the next try.
   *
   * TODO: remove after fixing registrar
   */
  let counter = 1
  const interval = 10_000
  await waitForExpect(() => {
    const communityId = store.getState().Communities.communities.ids[0]
    const userCertificate = store.getState().Identity.identities.entities[communityId].userCertificate
    const registrarError = store.getState().Errors.errors?.entities[SocketActionTypes.REGISTRAR]
    if (!userCertificate) {
      if (registrarError && registrarError.code === 503) {
        if (counter === retryCounter) {
          assert.fail(`User tried to register ${retryCounter} times. Giving up`)
        }
        log(`User ${username} is trying to register again`)
        store.dispatch(identity.actions.registerUsername(username))
        counter++
        assert.fail('Got 503 registrar code. User is clicking "register" button again')
      }
      assert.fail('Waiting...')
    }
  }, timeout, interval)
}

export const switchChannel = async ({ channelName, store }) => {
  const communityId = store.getState().Communities.communities.ids[0]
  store.dispatch(
    publicChannels.actions.setCurrentChannel({
      channelAddress: channelName,
      communityId: communityId.toString()
    })
  )
}

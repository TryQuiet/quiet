import { communities, CommunityOwnership, CreateNetworkPayload, identity, publicChannels } from '@quiet/nectar';
import assert from 'assert'
import { Register } from '../integrationTests/appActions';
import logger from '../logger'
import { AsyncReturnType } from '../types/AsyncReturnType.interface';
import { createApp } from '../utils';
const log = logger('bot')

const App: AsyncReturnType<typeof createApp> = null
type Store = typeof App.store
const timeout = 120_000

export const getRandomInt = (min: number, max: number) => {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min) + min);
}

const defaults = {
  timeout: 4500,
  interval: 50
};

/**
 * NOTE - this is copied from wait-to-expect module
 * 
 * Waits for the expectation to pass and returns a Promise
 *
 * @param  expectation  Function  Expectation that has to complete without throwing
 * @param  timeout  Number  Maximum wait interval, 4500ms by default
 * @param  interval  Number  Wait-between-retries interval, 50ms by default
 * @return  Promise  Promise to return a callback result
 */
export const waitForExpect = function waitForExpect(
  expectation: () => void | Promise<void>,
  timeout = defaults.timeout,
  interval = defaults.interval
) {

  // eslint-disable-next-line no-param-reassign
  if (interval < 1) interval = 1;
  const maxTries = Math.ceil(timeout / interval);
  let tries = 0;
  return new Promise((resolve, reject) => {
    const rejectOrRerun = (error: Error) => {
      if (tries > maxTries) {
        reject(error);
        return;
      }
      // eslint-disable-next-line no-use-before-define
      setTimeout(runExpectation, interval);
    };
    function runExpectation() {
      tries += 1;
      try {
        Promise.resolve(expectation())
        // @ts-expect-error
          .then(() => resolve())
          .catch(rejectOrRerun);
      } catch (error) {
        rejectOrRerun(error);
      }
    }
    setTimeout(runExpectation, 0);
  });
};

const assertContains = (value: any, container: any[]) => {
  if (container.includes(value)) return
  throw assert.fail(`${container} does not contain ${value}`)
}

export async function assertReceivedChannelAndSubscribe(
  userName: string,
  channelName: string,
  maxTime: number = 60000,
  store: Store
) {
  log(`User ${userName} starts waiting ${maxTime}ms for channels`)

  const communityId = store.getState().Communities.communities.ids[0] as string
  
  await waitForExpect(() => {
    assertContains(channelName, store.getState().PublicChannels.channels.entities[communityId].channels.ids)
  }, maxTime)
  log(`User ${userName} replicated '${channelName}'`)

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
}

export const createCommunity = async ({username, communityName, store, }): Promise<string> => {
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

  return store.getState().Identity.identities.entities[communityId].hiddenService.onionAddress
}

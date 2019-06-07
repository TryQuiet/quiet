/* eslint import/first: 0 */
jest.mock('../../vault')
jest.mock('../../zcash')

import BigNumber from 'bignumber.js'

import Immutable from 'immutable'
import * as R from 'ramda'

import create from '../create'
import identityHandlers, { IdentityState, Identity } from './identity'
import { NodeState } from './node'
import identitySelectors from '../selectors/identity'
import channelsSelectors from '../selectors/channels'
import { mock as zcashMock } from '../../zcash'
import vault, { mock } from '../../vault'
import testUtils from '../../testUtils'
import { createArchive } from '../../vault/marshalling'

describe('Identity reducer handles', () => {
  const identity = {
    name: 'Saturn',
    id: 'test-id',
    address: 'testaddress',
    transparentAddress: 'transparent-test-address'
  }

  let store = null
  beforeEach(() => {
    store = create({
      initialState: Immutable.Map({
        identity: IdentityState({
          data: Identity()
        }),
        node: NodeState({
          isTestnet: true
        })
      })
    })
    jest.clearAllMocks()
    mock.setArchive(createArchive())
  })

  const assertStoreState = () => expect(
    identitySelectors.identity(store.getState())
  ).toMatchSnapshot()

  describe('actions', () => {
    it('handles setIdentity', () => {
      store.dispatch(identityHandlers.actions.setIdentity(identity))
      assertStoreState()
    })

    each([true, false]).test(
      'handles setFetchingBalance to %s',
      async (fetching) => {
        await store.dispatch(
          identityHandlers.actions.setFetchingBalance(fetching)
        )
        assertStoreState()
      }
    )

    it('handles setBalance', async () => {
      await store.dispatch(
        identityHandlers.actions.setBalance(new BigNumber('2.34'))
      )
      assertStoreState()
    })

    it('handles setErrors', async () => {
      await store.dispatch(
        identityHandlers.actions.setErrors(new Error('this is some error'))
      )
      assertStoreState()
    })

    it('handles fetchBalance', async () => {
      zcashMock.requestManager.z_getbalance = jest.fn(
        async (address) => address === identity.address ? '2.2352' : '0.00234'
      )
      await store.dispatch(identityHandlers.actions.setIdentity(identity))

      await store.dispatch(identityHandlers.epics.fetchBalance())
      assertStoreState()
    })

    it('handles errors on fetchBalance', async () => {
      zcashMock.requestManager.z_getbalance = jest.fn(async (address) => {
        throw Error('node error')
      })
      await store.dispatch(identityHandlers.actions.setIdentity(identity))

      await store.dispatch(identityHandlers.epics.fetchBalance())
      assertStoreState()
    })
  })

  describe('epics', () => {
    describe('handles set identity', () => {
      beforeEach(async () => {
        zcashMock.requestManager.z_getbalance = jest.fn(
          async (address) => address === identity.address ? '2.2352' : '0.00234'
        )
        await Promise.all(
          R.range(0, 3).map(
            R.compose(
              R.curry(vault.getVault().channels.importChannel)(identity.id),
              testUtils.channels.createChannel
            )
          )
        )
        zcashMock.requestManager.z_sendmany.mockImplementation(async (from) => `${from}-op-id`)
      })

      it('- sets identity', async () => {
        await store.dispatch(identityHandlers.epics.setIdentity(identity))
        assertStoreState()
      })

      it('- loads channels', async () => {
        await store.dispatch(identityHandlers.epics.setIdentity(identity))
        const channels = channelsSelectors.channels(store.getState())
        expect(channels.data.map(ch => ch.delete('id'))).toMatchSnapshot()
      })
    })

    describe('handles createIdentity', () => {
      const identity = {
        name: 'Mercury'
      }

      beforeEach(() => {
        zcashMock.requestManager.z_getbalance = jest.fn(async (address) => '12.345')
        zcashMock.requestManager.z_getnewaddress = jest.fn(async (type) => `${type}-zcash-address`)
        zcashMock.requestManager.getnewaddress = jest.fn(async (type) => `transparent-zcash-address`)
        vault.identity.createIdentity.mockImplementation(
          async ({ name, address }) => ({ id: 'thisisatestid', name, address })
        )
      })

      it('creates identity in vault', async () => {
        await store.dispatch(identityHandlers.epics.createIdentity(identity))
        expect(vault.identity.createIdentity.mock.calls).toMatchSnapshot()
      })

      it('returns created identity', async () => {
        const result = await store.dispatch(identityHandlers.epics.createIdentity(identity))
        expect(result).toMatchSnapshot()
      })

      it('bootstraps general for testnet', async () => {
        await store.dispatch(identityHandlers.epics.createIdentity(identity))
        const channels = await vault.getVault().channels.listChannels('thisisatestid')
        expect(channels.map(R.omit(['id', 'hash']))).toMatchSnapshot()
      })

      it('bootstraps general for mainnet', async () => {
        store = create({
          initialState: Immutable.Map({
            identity: IdentityState({
              data: Identity()
            }),
            node: NodeState({
              isTestnet: false
            })
          })
        })
        await store.dispatch(identityHandlers.epics.createIdentity(identity))
        const channels = await vault.getVault().channels.listChannels('thisisatestid')
        expect(channels.map(R.omit(['id', 'hash']))).toMatchSnapshot()
      })
    })
  })
})

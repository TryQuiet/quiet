/* eslint import/first: 0 */
jest.mock('../../../shared/migrations/0_2_0')
jest.mock('../../vault')
jest.mock('../../zcash')

import BigNumber from 'bignumber.js'
import { DateTime } from 'luxon'

import Immutable from 'immutable'
import * as R from 'ramda'

import create from '../create'
import identityHandlers, { IdentityState, Identity } from './identity'
import { NodeState } from './node'
import identitySelectors from '../selectors/identity'
import channelsSelectors from '../selectors/channels'
import operationsSelectors from '../selectors/operations'
import { mock as zcashMock } from '../../zcash'
import vault, { mock } from '../../vault'
import testUtils from '../../testUtils'
import { createArchive } from '../../vault/marshalling'
import migrateTo_0_2_0 from '../../../shared/migrations/0_2_0' // eslint-disable-line camelcase

describe('Identity reducer handles', () => {
  const identity = {
    name: 'Saturn',
    id: 'test-id',
    address: 'testaddress',
    signerPrivKey: 'test-hex-key',
    signerPubKey: 'test-hex-key',
    transparentAddress: 'transparent-test-address',
    keys: {
      sk: 'sapling-private-key',
      tpk: 'transparent-private-key'
    }
  }
  const shippingData = {
    firstName: 'Rumble',
    lastName: 'Fish',
    street: 'RumbleFish street',
    country: 'RumbleFish country',
    region: 'Fish Region',
    city: 'Fishville',
    postalCode: '1337-455'
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

    it('handles setLockedBalance', async () => {
      await store.dispatch(
        identityHandlers.actions.setLockedBalance(new BigNumber('2.34'))
      )
      assertStoreState()
    })

    it('handles setErrors', async () => {
      await store.dispatch(
        identityHandlers.actions.setErrors(new Error('this is some error'))
      )
      assertStoreState()
    })

    it('- setLoading', async () => {
      await store.dispatch(
        identityHandlers.actions.setLoading(true)
      )
      assertStoreState()
    })

    it('- setLoadingMessage', async () => {
      await store.dispatch(
        identityHandlers.actions.setLoadingMessage('This is a loading message')
      )
      assertStoreState()
    })

    it('- setShippingData', async () => {
      await store.dispatch(
        identityHandlers.actions.setShippingData(shippingData)
      )
      assertStoreState()
    })
  })

  describe('epics', () => {
    beforeEach(() => {
      jest.spyOn(DateTime, 'utc').mockImplementation(() => testUtils.now)
    })

    describe('- fetchBalance', () => {
      it('creates shield balance operation', async () => {
        store.dispatch(identityHandlers.actions.setIdentity(identity))
        zcashMock.requestManager.z_getbalance.mockImplementation(
          async (address) => address === identity.address ? '2.2352' : '0.00234'
        )
        zcashMock.requestManager.z_sendmany.mockResolvedValue('test-op-id')

        await store.dispatch(identityHandlers.epics.fetchBalance())

        expect(operationsSelectors.operations(store.getState())).toMatchSnapshot()
      })

      it('fetches transparent and private balances', async () => {
        zcashMock.requestManager.z_getbalance = jest.fn(
          async (address) => address === identity.address ? '2.2352' : '0.00234'
        )
        await store.dispatch(identityHandlers.actions.setIdentity(identity))

        await store.dispatch(identityHandlers.epics.fetchBalance())
        assertStoreState()
      })

      it('handles errors', async () => {
        zcashMock.requestManager.z_getbalance = jest.fn(async (address) => {
          throw Error('node error')
        })
        await store.dispatch(identityHandlers.actions.setIdentity(identity))

        await store.dispatch(identityHandlers.epics.fetchBalance())
        assertStoreState()
      })
    })

    describe('handles updateShippingData', () => {
      const formActions = {
        setSubmitting: jest.fn()
      }

      it('- sets shipping data in store', async () => {
        vault.identity.updateShippingData.mockImplementation(async () => ({ ...identity, shippingData }))
        await store.dispatch(identityHandlers.epics.setIdentity(identity))

        await store.dispatch(identityHandlers.epics.updateShippingData(shippingData, formActions))
        assertStoreState()
      })

      it('- sets shipping data in vault', async () => {
        vault.identity.updateShippingData.mockImplementation(async () => ({ ...identity, shippingData }))
        await store.dispatch(identityHandlers.epics.setIdentity(identity))

        await store.dispatch(identityHandlers.epics.updateShippingData(shippingData, formActions))
        expect(vault.identity.updateShippingData.mock.calls).toMatchSnapshot()
      })

      it('- finishes form submitting', async () => {
        vault.identity.updateShippingData.mockImplementation(async () => ({ ...identity, shippingData }))
        await store.dispatch(identityHandlers.epics.setIdentity(identity))

        await store.dispatch(identityHandlers.epics.updateShippingData(shippingData, formActions))
        expect(formActions.setSubmitting.mock.calls).toMatchSnapshot()
      })
    })

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

      it('- migrates identity to 0.2.0', async () => {
        await store.dispatch(identityHandlers.epics.setIdentity(identity))
        expect(migrateTo_0_2_0.ensureIdentityHasKeys).toHaveBeenCalledWith(identity)
      })

      it('- makes sure node has identity keys', async () => {
        migrateTo_0_2_0.ensureIdentityHasKeys.mockResolvedValue(identity)
        await store.dispatch(identityHandlers.epics.setIdentity(identity))

        expect(zcashMock.requestManager.z_importkey).toHaveBeenCalledWith(
          identity.keys.sk, 'whenkeyisnew', 0
        )
        expect(zcashMock.requestManager.importprivkey).toHaveBeenCalledWith(identity.keys.tpk)
      })
    })

    describe('handles createIdentity', () => {
      const identity = {
        name: 'Mercury'
      }

      beforeEach(() => {
        zcashMock.requestManager.z_getbalance = jest.fn(async (address) => '12.345')
        vault.identity.createIdentity.mockImplementation(
          async (identity) => ({ id: 'thisisatestid', ...identity })
        )
      })

      it('creates identity in vault', async () => {
        identityHandlers.exportFunctions.createSignerKeys = jest.fn().mockReturnValue({
          signerPrivKey: 'test-hex-key',
          signerPubKey: 'test-hex-key'
        })
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

/* eslint import/first: 0 */
jest.mock('../../vault')
jest.mock('../../zcash', () => ({
  getClient: jest.fn(() => ({
    accounting: {}
  }))
}))

import BigNumber from 'bignumber.js'
import Immutable from 'immutable'
import * as R from 'ramda'

import create from '../create'
import identityHandlers, { IdentityState, Identity } from './identity'
import identitySelectors from '../selectors/identity'
import channelsSelectors from '../selectors/channels'
import { getClient } from '../../zcash'
import vault, { mock } from '../../vault'
import testUtils from '../../testUtils'
import { createArchive } from '../../vault/marshalling'

describe('Identity reducer handles', () => {
  const identity = {
    name: 'Saturn',
    id: 'test-id',
    address: 'testaddress'
  }

  let store = null
  beforeEach(() => {
    store = create({
      initialState: Immutable.Map({
        identity: IdentityState({
          data: Identity()
        })
      })
    })
    jest.clearAllMocks()
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
      getClient.mockImplementationOnce(() => ({
        accounting: {
          balance: async () => new BigNumber('2.2352')
        }
      }))
      await store.dispatch(identityHandlers.actions.setIdentity(identity))

      await store.dispatch(identityHandlers.epics.fetchBalance())
      assertStoreState()
    })

    it('handles errors on fetchBalance', async () => {
      getClient.mockImplementationOnce(() => ({
        accounting: {
          balance: async () => { throw Error('node error') }
        }
      }))
      await store.dispatch(identityHandlers.actions.setIdentity(identity))

      await store.dispatch(identityHandlers.epics.fetchBalance())
      assertStoreState()
    })
  })

  describe('epics', async () => {
    describe('handles set identity', () => {
      beforeEach(async () => {
        mock.setArchive(createArchive())
        await Promise.all(
          R.range(0, 3).map(
            R.compose(
              R.curry(vault.getVault().channels.importChannel)(identity.id),
              testUtils.channels.createChannel
            )
          )
        )
        getClient.mockImplementationOnce(() => ({
          accounting: {
            balance: async () => new BigNumber('2.2352')
          }
        }))
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
      const bootstrapChannels = jest.fn(async () => null)
      beforeEach(() => {
        vault.getVault.mockImplementation(() => ({
          channels: {
            bootstrapChannels
          }
        }))
        const createMock = jest.fn(async (type) => `${type}-zcash-address`)
        const balanceMock = jest.fn(async (address) => new BigNumber('12.345'))
        getClient.mockImplementation(() => ({
          addresses: { create: createMock },
          accounting: { balance: balanceMock }
        }))
        vault.identity.createIdentity.mockImplementation(
          async ({ name, address }) => ({ id: 'thisisatestid', name, address })
        )
      })

      it('creates identity in vault', async () => {
        await store.dispatch(identityHandlers.epics.createIdentity())
        expect(vault.identity.createIdentity.mock.calls).toMatchSnapshot()
      })

      it('returns created identity', async () => {
        const result = await store.dispatch(identityHandlers.epics.createIdentity())
        expect(result).toMatchSnapshot()
      })

      it('bootstraps channels', async () => {
        await store.dispatch(identityHandlers.epics.createIdentity())
        expect(bootstrapChannels.mock.calls).toMatchSnapshot()
      })
    })
  })
})

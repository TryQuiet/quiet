/* eslint import/first: 0 */
jest.mock('../../zcash', () => ({
  getClient: jest.fn(() => ({
    accounting: {}
  }))
}))

import BigNumber from 'bignumber.js'
import Immutable from 'immutable'

import create from '../create'
import identityHandlers, { IdentityState, Identity } from './identity'
import identitySelectors from '../selectors/identity'
import { getClient } from '../../zcash'

describe('Identity reducer handles', () => {
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
    const identity = {
      name: 'Saturn',
      id: 'test-id',
      address: 'testaddress'
    }

    it('handles setIdentity', async () => {
      await store.dispatch(identityHandlers.actions.setIdentity(identity))
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
      getClient.mockImplementation(() => ({
        accounting: {
          balance: async () => new BigNumber('2.2352')
        }
      }))
      await store.dispatch(identityHandlers.actions.setIdentity(identity))

      await store.dispatch(identityHandlers.epics.fetchBalance())
      assertStoreState()
    })

    it('handles errors on fetchBalance', async () => {
      getClient.mockImplementation(() => ({
        accounting: {
          balance: async () => { throw Error('node error') }
        }
      }))
      await store.dispatch(identityHandlers.actions.setIdentity(identity))

      await store.dispatch(identityHandlers.epics.fetchBalance())
      assertStoreState()
    })
  })
})

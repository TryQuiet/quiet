/* eslint import/first: 0 */
jest.mock('../../../shared/migrations/0_2_0')
jest.mock('../../zcash')
jest.mock('../../../shared/electronStore', () => ({
  set: () => {},
  get: () => {}
}))
jest.mock('electron', () => {
  const remote = jest.mock()
  const ipcRenderer = jest.mock()
  remote.app = jest.mock()
  remote.process = jest.mock()
  remote.process.on = jest.fn()
  remote.app.getVersion = jest.fn().mockReturnValue('0.13.37')
  ipcRenderer.on = jest.fn().mockReturnValue('ok')
  ipcRenderer.send = jest.fn().mockReturnValue('ok')
  return { remote, ipcRenderer }
})

import { remote } from 'electron'
import BigNumber from 'bignumber.js'
import { DateTime } from 'luxon'

import create from '../create'
import identityHandlers, { initialState } from './identity'
import { NodeState } from './node'
import identitySelectors from '../selectors/identity'
import usersHandlers from './users'
import testUtils from '../../testUtils'

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
      initialState: {
        identity: {
          ...initialState
        },
        node: {
          ...NodeState,
          isTestnet: true
        }
      }
    })
    remote.app = jest.mock()
    jest.clearAllMocks()
    jest.spyOn(usersHandlers.epics, 'fetchUsers').mockImplementation(() => {})
  })

  const assertStoreState = () =>
    expect(identitySelectors.identity(store.getState())).toMatchSnapshot()

  describe('actions', () => {
    it('handles setIdentity', () => {
      store.dispatch(identityHandlers.actions.setIdentity(identity))
      assertStoreState()
    })

    each([true, false]).test(
      'handles setFetchingBalance to %s',
      async fetching => {
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
      await store.dispatch(identityHandlers.actions.setLoading(true))
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
    it('- setDonationAllow', async () => {
      await store.dispatch(identityHandlers.actions.setDonationAllow(false))
      assertStoreState()
    })
  })

  describe('epics', () => {
    beforeEach(() => {
      jest.spyOn(DateTime, 'utc').mockImplementation(() => testUtils.now)
    })

    describe('handles updateShippingData', () => {
      const formActions = {
        setSubmitting: jest.fn()
      }

      it('- sets shipping data in store', async () => {
        await store.dispatch(identityHandlers.epics.setIdentity(identity))

        await store.dispatch(
          identityHandlers.epics.updateShippingData(shippingData, formActions)
        )
        assertStoreState()
      })

      it('- finishes form submitting', async () => {
        await store.dispatch(identityHandlers.epics.setIdentity(identity))

        await store.dispatch(
          identityHandlers.epics.updateShippingData(shippingData, formActions)
        )
        expect(formActions.setSubmitting.mock.calls).toMatchSnapshot()
      })
    })
  })
})

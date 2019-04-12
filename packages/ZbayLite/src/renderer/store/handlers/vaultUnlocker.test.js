/* eslint import/first: 0 */
jest.mock('../../vault')
jest.mock('../../zcash')

import BigNumber from 'bignumber.js'

import create from '../create'
import vault, { mock } from '../../vault'
import { createArchive } from '../../vault/marshalling'
import selectors from '../selectors/vaultUnlocker'
import vaultSelectors from '../selectors/vault'
import identitySelectors from '../selectors/identity'
import channelsSelectors from '../selectors/channels'
import { actions, VaultUnlockerState, epics } from './vaultUnlocker'
import { mockEvent } from '../../../shared/testing/mocks'
import { getClient } from '../../zcash'

describe('VaultUnlocker reducer', () => {
  let store = null
  beforeEach(() => {
    store = create()
    jest.clearAllMocks()
  })

  const assertStoreState = () => expect(selectors.unlocker(store.getState())).toMatchSnapshot()

  describe('handles actions', () => {
    it('setPassword', () => {
      store.dispatch(actions.setPassword(mockEvent('test password')))
      assertStoreState()
    })

    it('togglePasswordVisibility', () => {
      expect(selectors.passwordVisible(store.getState())).toBeFalsy()
      store.dispatch(actions.togglePasswordVisibility())
      expect(selectors.passwordVisible(store.getState())).toBeTruthy()
      store.dispatch(actions.togglePasswordVisibility())
      expect(selectors.passwordVisible(store.getState())).toBeFalsy()
    })

    it('clearUnlocker', async () => {
      const password = 'test_password'
      store.dispatch(actions.togglePasswordVisibility())
      store.dispatch(actions.setPassword(mockEvent(password)))

      const expected = VaultUnlockerState({
        passwordVisible: true,
        password
      })
      expect(selectors.unlocker(store.getState())).toEqual(expected)

      await store.dispatch(actions.clearUnlocker())
      assertStoreState()
    })
  })

  describe('handles epics', () => {
    describe('unlockVault', () => {
      const identity = {
        id: 'test-id',
        name: 'Saturn',
        address: 'test-address'
      }
      const balance = new BigNumber('12.345')

      beforeEach(() => {
        mock.setArchive(createArchive())
        vault.identity.listIdentities.mockImplementation(async () => [identity])
        const balanceMock = jest.fn(async (address) => balance)
        getClient.mockImplementation(() => ({
          accounting: { balance: balanceMock }
        }))
      })

      it('unlocks the vault', async () => {
        store.dispatch(actions.setPassword(mockEvent('test password')))
        expect(vaultSelectors.locked(store.getState())).toBeTruthy()

        await store.dispatch(epics.unlockVault())

        expect(vaultSelectors.locked(store.getState())).toBeFalsy()
        expect(selectors.unlocker(store.getState())).toEqual(VaultUnlockerState())
        expect(vault.unlock.mock.calls).toMatchSnapshot()
      })

      it('bootstraps channels', async () => {
        store.dispatch(actions.setPassword(mockEvent('test password')))
        expect(vaultSelectors.locked(store.getState())).toBeTruthy()

        await store.dispatch(epics.unlockVault())

        const currentIdentity = identitySelectors.identity(store.getState())
        expect(currentIdentity.toJS().data).toEqual({ ...identity, balance })
        const channels = channelsSelectors.data(store.getState())
        expect(channels.map(ch => ch.delete('id')))
      })

      it('clears after unlock throws', async () => {
        vault.unlock.mockImplementationOnce(async () => { throw Error('unlock error') })
        store.dispatch(actions.setPassword(mockEvent('test password')))
        expect(vaultSelectors.locked(store.getState())).toBeTruthy()

        await store.dispatch(epics.unlockVault())

        expect(vaultSelectors.locked(store.getState())).toBeTruthy()
        assertStoreState()
      })
    })
  })
})

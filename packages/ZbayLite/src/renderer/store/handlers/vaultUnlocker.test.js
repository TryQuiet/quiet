/* eslint import/first: 0 */
jest.mock('../../vault', () => ({
  create: jest.fn(async () => null),
  unlock: jest.fn(async () => null),
  exists: jest.fn(() => true)
}))

import create from '../create'
import vault from '../../vault'
import selectors from '../selectors/vaultUnlocker'
import vaultSelectors from '../selectors/vault'
import { actions, VaultUnlockerState, epics } from './vaultUnlocker'
import { mockEvent } from '../../../shared/testing/mocks'

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
      it('unlocks the vault', async () => {
        store.dispatch(actions.setPassword(mockEvent('test password')))
        expect(vaultSelectors.locked(store.getState())).toBeTruthy()

        await store.dispatch(epics.unlockVault())

        expect(vaultSelectors.locked(store.getState())).toBeFalsy()
        expect(selectors.unlocker(store.getState())).toEqual(VaultUnlockerState())
        expect(vault.unlock.mock.calls).toMatchSnapshot()
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

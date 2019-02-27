/* eslint import/first: 0 */
jest.mock('../../vault', () => ({
  create: jest.fn(async () => null),
  unlock: jest.fn(async () => null),
  exists: jest.fn(() => false)
}))

import create from '../create'
import vault from '../../vault'
import selectors from '../selectors/vaultCreator'
import vaultSelectors from '../selectors/vault'
import { actions, VaultCreatorState, epics } from './vaultCreator'
import { mockEvent } from '../../../shared/testing/mocks'

describe('VaultCreator reducer', () => {
  let store = null
  beforeEach(() => {
    store = create()
    jest.clearAllMocks()
  })

  const assertStoreState = () => expect(selectors.creator(store.getState())).toMatchSnapshot()

  describe('handles actions', () => {
    it('setPassword', () => {
      store.dispatch(actions.setPassword(mockEvent('test password')))
      assertStoreState()
    })

    it('setRepeat', () => {
      store.dispatch(actions.setRepeat(mockEvent('test password')))
      assertStoreState()
    })

    it('togglePasswordVisibility', () => {
      expect(selectors.passwordVisible(store.getState())).toBeFalsy()
      store.dispatch(actions.togglePasswordVisibility())
      expect(selectors.passwordVisible(store.getState())).toBeTruthy()
      store.dispatch(actions.togglePasswordVisibility())
      expect(selectors.passwordVisible(store.getState())).toBeFalsy()
    })

    it('toggleRepeatVisibility', () => {
      expect(selectors.repeatVisible(store.getState())).toBeFalsy()
      store.dispatch(actions.toggleRepeatVisibility())
      expect(selectors.repeatVisible(store.getState())).toBeTruthy()
      store.dispatch(actions.toggleRepeatVisibility())
      expect(selectors.repeatVisible(store.getState())).toBeFalsy()
    })

    it('clearCreator', () => {
      const password = 'test password'
      const repeat = 'test repeat'
      store.dispatch(actions.toggleRepeatVisibility())
      store.dispatch(actions.togglePasswordVisibility())
      store.dispatch(actions.setPassword(mockEvent(password)))
      store.dispatch(actions.setRepeat(mockEvent(repeat)))

      // sanity check
      const expected = VaultCreatorState({
        password,
        repeat,
        passwordVisible: true,
        repeatVisible: true
      })
      const middleState = selectors.creator(store.getState())
      expect(expected).toEqual(middleState)

      store.dispatch(actions.clearCreator())
      assertStoreState()
    })
  })

  describe('handles epics', () => {
    describe('createVault', () => {
      it('creates the vault', async () => {
        const password = 'test password'
        store.dispatch(actions.setPassword(mockEvent(password)))
        store.dispatch(actions.setRepeat(mockEvent(password)))

        expect(vaultSelectors.exists(store.getState())).toBeFalsy()

        await store.dispatch(epics.createVault())

        expect(vaultSelectors.exists(store.getState())).toBeTruthy()
        expect(vault.create.mock.calls).toMatchSnapshot()
      })

      it('unlocks the vault', async () => {
        const password = 'test password'
        store.dispatch(actions.setPassword(mockEvent(password)))
        store.dispatch(actions.setRepeat(mockEvent(password)))

        expect(vaultSelectors.locked(store.getState())).toBeTruthy()

        await store.dispatch(epics.createVault())

        expect(vaultSelectors.locked(store.getState())).toBeFalsy()
        expect(selectors.creator(store.getState())).toEqual(VaultCreatorState())
        expect(vault.unlock.mock.calls).toMatchSnapshot()
      })

      it('throws if passwords don\'t match', async () => {
        store.dispatch(actions.setPassword(mockEvent('test1')))
        store.dispatch(actions.setRepeat(mockEvent('test2')))

        expect(store.dispatch(epics.createVault())).rejects.toThrowErrorMatchingSnapshot()
        const expectedState = VaultCreatorState()
        const resultState = selectors.creator(store.getState())
        expect(expectedState).toEqual(resultState)
        expect(vaultSelectors.exists(store.getState())).toBeFalsy()
        expect(vaultSelectors.locked(store.getState())).toBeTruthy()
      })

      it('clears creator if creating fails', async () => {
        const password = 'test password'
        store.dispatch(actions.setPassword(mockEvent(password)))
        store.dispatch(actions.setRepeat(mockEvent(password)))
        vault.create.mockImplementationOnce(async () => { throw Error('creation error') })

        await store.dispatch(epics.createVault())

        expect(vaultSelectors.exists(store.getState())).toBeFalsy()
        expect(vaultSelectors.locked(store.getState())).toBeTruthy()
        assertStoreState()
      })

      it('clears creator if unlocking fails', async () => {
        const password = 'test password'
        store.dispatch(actions.setPassword(mockEvent(password)))
        store.dispatch(actions.setRepeat(mockEvent(password)))
        vault.unlock.mockImplementationOnce(async () => { throw Error('unlocking error') })

        await store.dispatch(epics.createVault())

        expect(vaultSelectors.exists(store.getState())).toBeTruthy()
        expect(vaultSelectors.locked(store.getState())).toBeTruthy()
        assertStoreState()
      })
    })
  })
})

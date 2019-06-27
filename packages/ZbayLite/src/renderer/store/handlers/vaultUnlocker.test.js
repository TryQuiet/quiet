/* eslint import/first: 0 */
jest.mock('../../../shared/migrations/0_2_0')
jest.mock('../../vault')
jest.mock('../../zcash')
import Immutable from 'immutable'
import BigNumber from 'bignumber.js'
import * as R from 'ramda'

import create from '../create'
import vault, { mock } from '../../vault'
import { createArchive } from '../../vault/marshalling'
import selectors from '../selectors/vaultUnlocker'
import vaultSelectors from '../selectors/vault'
import identitySelectors from '../selectors/identity'
import channelsSelectors from '../selectors/channels'
import criticalErrorSelectors from '../selectors/criticalError'
import { actions, VaultUnlockerState, epics } from './vaultUnlocker'
import { NodeState } from './node'
import { mockEvent } from '../../../shared/testing/mocks'
import { mock as zcashMock } from '../../zcash'
import { createIdentity } from '../../testUtils'

describe('VaultUnlocker reducer', () => {
  let store = null
  beforeEach(() => {
    store = create({
      initialState: Immutable.Map({
        node: NodeState({ isTestnet: true })
      })
    })
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
        ...createIdentity(),
        id: 'test-id'
      }
      const balance = new BigNumber('12.345')
      const transparentBalance = new BigNumber('0.2341')

      beforeEach(() => {
        mock.setArchive(createArchive())
        vault.identity.listIdentities.mockImplementation(async () => [identity])
        zcashMock.requestManager.z_getbalance.mockImplementation(
          async (addr) => addr === identity.address ? balance : transparentBalance
        )
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

        expect(currentIdentity.toJS().data).toEqual({ ...R.omit(['keys'], identity), balance })
        const channels = channelsSelectors.data(store.getState())
        expect(channels.map(ch => ch.delete('id')))
      })

      it('generates critical errors', async () => {
        jest.spyOn(console, 'warn').mockImplementation()
        vault.unlock.mockImplementationOnce(async () => { throw Error('unlock error') })
        store.dispatch(actions.setPassword(mockEvent('test password')))
        expect(vaultSelectors.locked(store.getState())).toBeTruthy()

        try {
          await store.dispatch(epics.unlockVault())
        } catch (err) {}

        expect(vaultSelectors.locked(store.getState())).toBeTruthy()
        const error = criticalErrorSelectors.criticalError(store.getState())
        expect(error.message).toMatchSnapshot()
        expect(error.traceback).toEqual(expect.stringContaining(error.message))
      })
    })
  })
})

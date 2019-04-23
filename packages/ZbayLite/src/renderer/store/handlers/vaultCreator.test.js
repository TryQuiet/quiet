/* eslint import/first: 0 */
jest.mock('../../vault')
jest.mock('../../zcash', () => ({
  getClient: jest.fn(() => ({
    accounting: {}
  }))
}))

import BigNumber from 'bignumber.js'

import create from '../create'
import vault, { mock } from '../../vault'
import selectors from '../selectors/vaultCreator'
import vaultSelectors from '../selectors/vault'
import channelsSelectors from '../selectors/channels'
import identitySelectors from '../selectors/identity'
import { actions, VaultCreatorState, epics } from './vaultCreator'
import { mockEvent } from '../../../shared/testing/mocks'
import { getClient } from '../../zcash'
import { createArchive } from '../../vault/marshalling'

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
      const createMock = jest.fn(async (type) => `${type}-zcash-address`)
      const balanceMock = jest.fn(async (address) => new BigNumber('12.345'))
      const importIVK = jest.fn(async () => null)
      beforeEach(() => {
        mock.setArchive(createArchive())

        // zcash client mock
        getClient.mockImplementation(() => ({
          addresses: { create: createMock },
          accounting: { balance: balanceMock },
          keys: { importIVK }
        }))

        // old vault client mock
        vault.identity.createIdentity.mockImplementation(
          async ({ name, address }) => ({ id: 'thisisatestid', name, address })
        )

        const password = 'test password'
        store.dispatch(actions.setPassword(mockEvent(password)))
        store.dispatch(actions.setRepeat(mockEvent(password)))
      })

      it('creates the vault', async () => {
        expect(vaultSelectors.exists(store.getState())).toBeFalsy()

        await store.dispatch(epics.createVault())

        expect(vaultSelectors.exists(store.getState())).toBeTruthy()
        expect(vault.create.mock.calls).toMatchSnapshot()
      })

      it('unlocks the vault', async () => {
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
        vault.create.mockImplementationOnce(async () => { throw Error('creation error') })

        await store.dispatch(epics.createVault())

        expect(vaultSelectors.exists(store.getState())).toBeFalsy()
        expect(vaultSelectors.locked(store.getState())).toBeTruthy()
        assertStoreState()
      })

      it('clears creator if unlocking fails', async () => {
        vault.unlock.mockImplementationOnce(async () => { throw Error('unlocking error') })

        await store.dispatch(epics.createVault())

        expect(vaultSelectors.exists(store.getState())).toBeTruthy()
        expect(vaultSelectors.locked(store.getState())).toBeTruthy()
        assertStoreState()
      })

      it('creates identity and sets balance', async () => {
        await store.dispatch(epics.createVault())

        expect(identitySelectors.identity(store.getState())).toMatchSnapshot()
        expect(createMock).toHaveBeenCalledWith('sapling')
        expect(balanceMock).toHaveBeenCalledWith(await createMock('sapling'))
      })

      it('bootstraps general channel to new account', async () => {
        await store.dispatch(epics.createVault())
        const channels = channelsSelectors.channels(store.getState())
        expect(channels.data.map(ch => ch.delete('id'))).toMatchSnapshot()
        expect(importIVK).toHaveBeenCalledWith({
          address: 'ztestsapling16e4wekqjyx80yjjzf24ztyflt2c5tt6avt4nftgnj694n8e5x8fz5pr9ejsd3l9lmymf29khjnk',
          ivk: 'zivktestsapling1p5rp2czztl8amalqm5ghzvhr35n08h26vhphnw2x6k83trft7sqsn9qkd6'
        })
      })
    })
  })
})

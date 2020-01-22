/* eslint import/first: 0 */
jest.mock('../../../shared/migrations/0_2_0')
jest.mock('../../vault')
jest.mock('../../zcash')
jest.mock('crypto')
jest.mock('../../../shared/electronStore', () => ({
  set: () => {},
  get: () => {}
}))

import crypto from 'crypto'
import Immutable from 'immutable'
import { DateTime } from 'luxon'

import { actions, epics, actionTypes } from './vault'
import identityHandlers from './identity'
import { typePending } from './utils'
import create from '../create'
import { client } from './rates'
import vault, { mock } from '../../vault'
import vaultSelectors from '../selectors/vault'
import channelsSelectors from '../selectors/channels'
import identitySelectors from '../selectors/identity'
import usersHandlers from './users'
import { NodeState } from './node'
import { mock as zcashMock } from '../../zcash'
import { createArchive } from '../../vault/marshalling'
import { createIdentity, now } from '../../testUtils'
import electronStore from '../../../shared/electronStore'

describe('vault reducer', () => {
  let store = null
  beforeEach(() => {
    jest.clearAllMocks()
    store = create({
      initialState: Immutable.Map({
        node: NodeState({
          isTestnet: true
        })
      })
    })
    jest.spyOn(client, 'avgPrice').mockImplementation(() => {})
  })

  const assertStoreState = () => expect(store.getState().get('vault')).toMatchSnapshot()

  it('handles createVault', async () => {
    await store.dispatch(actions.createVault())
    assertStoreState()
  })

  it('handles createVault with loading state', async () => {
    store.dispatch({ type: typePending(actionTypes.CREATE) })
    assertStoreState()
  })

  it('handles createVault error', async () => {
    vault.create.mockImplementationOnce(async () => {
      throw Error('This is a test error')
    })
    try {
      await store.dispatch(actions.createVault())
    } catch (err) {}
    assertStoreState()
  })

  it('handles unlockVault', async () => {
    await store.dispatch(actions.createVault())
    await store.dispatch(actions.unlockVault({ masterPassword: 'test' }))
    assertStoreState()
  })

  it('handles unlockVault with unlocking state', async () => {
    await store.dispatch(actions.createVault())
    store.dispatch({ type: typePending(actionTypes.UNLOCK) })
    assertStoreState()
  })

  it('handles unlockVault error', async () => {
    await store.dispatch(actions.createVault())
    vault.unlock.mockImplementationOnce(async () => {
      throw Error('This is a test error')
    })
    try {
      await store.dispatch(actions.unlockVault({ masterPassword: 'test' }))
    } catch (err) {}
    assertStoreState()
  })

  it('handles createIdentity', async () => {
    const identityObj = createIdentity()
    const createdIdentity = {
      id: 'test id',
      ...identityObj
    }
    vault.identity.createIdentity.mockImplementation(async () => createdIdentity)
    const result = await store.dispatch(actions.createIdentity(identityObj))
    expect(vault.identity.createIdentity).toHaveBeenCalledWith(identityObj)
    expect(result.value).toEqual(createdIdentity)
    assertStoreState()
  })

  it('handles updateIdentitySignerKeys', async () => {
    const updatedIdentity = {
      id: 'test id',
      name: 'Saturn',
      address: 'saturn-private-address',
      transparentAddress: 'saturn-transparent-address',
      signerPrivKey: 'AyrXTov+4FEyle1BrxndDhePlUOB1nPV5YvyexC8m6E=',
      signerPubKey: 'Alw9G29ahXm5et9T7FJF3lbXVXNkapR826yPtfMVJYnK',
      keys: {
        tpk: 'saturn-tpk',
        sk: 'saturn-sk'
      }
    }
    const updateSignerKeysObj = {
      id: 'test id',
      signerPrivKey: 'KbtPfOrzAoAkbZxsNt/VdIp3J5owzgCFcm5PRs4iYBQ=',
      signerPubKey: 'Ay4dSDZfpd9qRDxc80nDE4Ee+PGZ3aY4h3uxONDcBnK2'
    }
    vault.identity.updateIdentitySignerKeys.mockImplementation(async () => updatedIdentity)
    const result = await store.dispatch(actions.updateIdentitySignerKeys(updateSignerKeysObj))
    expect(vault.identity.updateIdentitySignerKeys).toHaveBeenCalledWith(updateSignerKeysObj)
    expect(result.value).toMatchSnapshot()
    assertStoreState()
  })

  it('handles pending createIdentity', async () => {
    store.dispatch({ type: typePending(actionTypes.CREATE_IDENTITY) })
    assertStoreState()
  })

  it('handles createIdentity error', async () => {
    vault.identity.createIdentity.mockImplementationOnce(async () => {
      throw Error('This is a test error')
    })
    try {
      await store.dispatch(actions.createIdentity({ name: 'test', address: 'testaddress' }))
    } catch (err) {}
    assertStoreState()
  })

  it('handles clear error', async () => {
    const errorMsg = 'This is a test error'
    vault.unlock.mockImplementationOnce(async () => {
      throw Error(errorMsg)
    })
    try {
      await store.dispatch(actions.unlockVault({ masterPassword: 'password' }))
    } catch (err) {}

    const vaultStore = store.getState().get('vault')
    expect(vaultStore.error).toEqual(errorMsg)

    store.dispatch(actions.clearError())
    assertStoreState()
  })

  it('handles setVaultStatus', () => {
    store.dispatch(actions.setVaultStatus(true))
    expect(vaultSelectors.exists(store.getState())).toBeTruthy()
    store.dispatch(actions.setVaultStatus(false))
    expect(vaultSelectors.exists(store.getState())).toBeFalsy()
  })

  describe('epics', () => {
    describe('- loadVaultStatus', () => {
      beforeEach(() => {
        vault.exists.mockImplementation(network => network === 'mainnet')

        // old vault client mock
        vault.identity.createIdentity.mockImplementation(async ({ name, address }) => ({
          id: 'thisisatestid',
          name,
          address
        }))
        process.env.ZBAY_IS_TESTNET = 1
      })

      it('when vault exists', () => {
        store = create({
          initialState: Immutable.Map({
            node: NodeState({ isTestnet: false })
          })
        })
        process.env.ZBAY_IS_TESTNET = 0
        store.dispatch(epics.loadVaultStatus())
        expect(vaultSelectors.exists(store.getState())).toBeTruthy()
      })

      it('when vault doesn not exists', () => {
        store = create({
          initialState: Immutable.Map({
            node: NodeState({ isTestnet: true })
          })
        })

        store.dispatch(epics.loadVaultStatus())

        expect(vaultSelectors.exists(store.getState())).toBeFalsy()
      })
    })

    describe('- createVault', () => {
      const formActions = {
        setSubmitting: jest.fn()
      }
      const formValues = {
        name: 'Mercury',
        password: 'testPassword'
      }

      beforeEach(() => {
        crypto.randomBytes.mockImplementationOnce(() => Buffer.from('test'))
        mock.setArchive(createArchive())
        jest.spyOn(DateTime, 'utc').mockImplementationOnce(() => now)
        vault.identity.createIdentity.mockImplementation(async identity => ({
          ...identity,
          id: 'thisisatestid'
        }))
        jest.spyOn(usersHandlers.epics, 'fetchUsers').mockImplementation(() => {})
      })

      it('creates the vault', async () => {
        expect(vaultSelectors.exists(store.getState())).toBeFalsy()

        await store.dispatch(epics.createVault(formValues, formActions))

        expect(vaultSelectors.exists(store.getState())).toBeTruthy()
        expect(vault.create.mock.calls).toMatchSnapshot()
      })

      it('unlocks the vault', async () => {
        expect(vaultSelectors.locked(store.getState())).toBeTruthy()

        await store.dispatch(epics.createVault(formValues, formActions))

        expect(vaultSelectors.locked(store.getState())).toBeFalsy()
        expect(vault.unlock.mock.calls).toMatchSnapshot()
      })

      it('creates identity and sets balance', async () => {
        jest.spyOn(electronStore, 'get').mockImplementation(() => 'SUCCESS')
        identityHandlers.exportFunctions.createSignerKeys = jest.fn().mockReturnValue({
          signerPrivKey: 'KbtPfOrzAoAkbZxsNt/VdIp3J5owzgCFcm5PRs4iYBQ=',
          signerPubKey: 'Ay4dSDZfpd9qRDxc80nDE4Ee+PGZ3aY4h3uxONDcBnK2'
        })
        zcashMock.requestManager.z_getbalance = jest.fn(async addr =>
          addr === 'sapling-private-address' ? '2.2352' : '0.00234'
        )
        zcashMock.requestManager.z_listunspent = jest.fn(async () => [0])

        await store.dispatch(epics.createVault(formValues, formActions))

        expect(identitySelectors.identity(store.getState())).toMatchSnapshot()
        expect(zcashMock.requestManager.z_getnewaddress).toHaveBeenCalledWith('sapling')
        expect(zcashMock.requestManager.z_getbalance).toHaveBeenCalledWith(
          'sapling-private-address'
        )
        expect(zcashMock.requestManager.z_listunspent).toHaveBeenCalledWith(0, 0, false, [
          'sapling-private-address'
        ])
      })

      it('bootstraps general channel to new account', async () => {
        jest.spyOn(electronStore, 'get').mockImplementation(() => 'SUCCESS')
        await store.dispatch(epics.createVault(formValues, formActions))

        const channels = channelsSelectors.channels(store.getState())
        expect(channels.data.map(ch => ch.delete('id'))).toMatchSnapshot()
        expect(zcashMock.requestManager.z_importviewingkey).toHaveBeenCalledWith(
          'zivktestsapling1algnz2x84pqcnfdxrlntw73wpuqm3v568cepf5tuctyusm9javpqyjyzqy',
          'no',
          0,
          'ztestsapling1dfjv308amnk40s89trkvz646ne69553us0g858mmpgsw540efgftn4tf25gts2cttg3jgk9y8lx'
        )
      })
    })
  })
})

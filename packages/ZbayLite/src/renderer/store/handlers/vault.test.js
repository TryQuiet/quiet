/* eslint import/first: 0 */
jest.mock('../../../shared/migrations/0_2_0')
jest.mock('../../vault')
jest.mock('../../zcash')
import Immutable from 'immutable'

import { actions, epics, initialState, actionTypes } from './vault'
import { typePending } from './utils'
import create from '../create'
import vault, { mock } from '../../vault'
import vaultSelectors from '../selectors/vault'
import channelsSelectors from '../selectors/channels'
import identitySelectors from '../selectors/identity'
import { NodeState } from './node'
import { mock as zcashMock } from '../../zcash'
import { createArchive } from '../../vault/marshalling'
import { createIdentity } from '../../testUtils'

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
  })

  const assertStoreState = () => expect(store.getState().get('vault')).toMatchSnapshot()

  it('is initialized with vault existence information', async () => {
    expect(initialState.exists).toBeDefined()
    expect(initialState.exists).toEqual(vault.exists())
  })

  it('handles createVault', async () => {
    await store.dispatch(actions.createVault())
    assertStoreState()
  })

  it('handles createVault with loading state', async () => {
    store.dispatch({ type: typePending(actionTypes.CREATE) })
    assertStoreState()
  })

  it('handles createVault error', async () => {
    vault.create.mockImplementationOnce(async () => { throw Error('This is a test error') })
    try {
      await store.dispatch(actions.createVault())
    } catch (err) {}
    assertStoreState()
  })

  it('handles unlockVault', async () => {
    await store.dispatch(actions.createVault())
    await store.dispatch(actions.unlockVault())
    assertStoreState()
  })

  it('handles unlockVault with unlocking state', async () => {
    await store.dispatch(actions.createVault())
    store.dispatch({ type: typePending(actionTypes.UNLOCK) })
    assertStoreState()
  })

  it('handles unlockVault error', async () => {
    await store.dispatch(actions.createVault())
    vault.unlock.mockImplementationOnce(async () => { throw Error('This is a test error') })
    try {
      await store.dispatch(actions.unlockVault())
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
    const result = await store.dispatch(
      actions.createIdentity(identityObj)
    )
    expect(vault.identity.createIdentity).toHaveBeenCalledWith(identityObj)
    expect(result.value).toEqual(createdIdentity)
    assertStoreState()
  })

  it('handles pending createIdentity', async () => {
    store.dispatch({ type: typePending(actionTypes.CREATE_IDENTITY) })
    assertStoreState()
  })

  it('handles createIdentity error', async () => {
    vault.identity.createIdentity.mockImplementationOnce(async () => { throw Error('This is a test error') })
    try {
      await store.dispatch(actions.createIdentity({ name: 'test', address: 'testaddress' }))
    } catch (err) {}
    assertStoreState()
  })

  it('handles clear error', async () => {
    const errorMsg = 'This is a test error'
    vault.unlock.mockImplementationOnce(async () => { throw Error(errorMsg) })
    try {
      await store.dispatch(actions.unlockVault())
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
        vault.identity.createIdentity.mockImplementation(
          async ({ name, address }) => ({ id: 'thisisatestid', name, address })
        )
      })

      it('when vault exists', () => {
        store = create({
          initialState: Immutable.Map({
            node: NodeState({ isTestnet: false })
          })
        })

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
        mock.setArchive(createArchive())

        vault.identity.createIdentity.mockImplementation(
          async (identity) => ({ ...identity, id: 'thisisatestid' })
        )
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
        zcashMock.requestManager.z_getbalance = jest.fn(
          async (addr) => addr === 'sapling-private-address' ? '2.2352' : '0.00234'
        )
        zcashMock.requestManager.z_listunspent = jest.fn(async () => [0])

        await store.dispatch(epics.createVault(formValues, formActions))

        expect(identitySelectors.identity(store.getState())).toMatchSnapshot()
        expect(zcashMock.requestManager.z_getnewaddress).toHaveBeenCalledWith('sapling')
        expect(zcashMock.requestManager.z_getbalance).toHaveBeenCalledWith('sapling-private-address')
        expect(zcashMock.requestManager.z_listunspent).toHaveBeenCalledWith(0, 0, false, ['sapling-private-address'])
      })

      it('bootstraps general channel to new account', async () => {
        await store.dispatch(epics.createVault(formValues, formActions))

        const channels = channelsSelectors.channels(store.getState())
        expect(channels.data.map(ch => ch.delete('id'))).toMatchSnapshot()
        expect(zcashMock.requestManager.z_importviewingkey).toHaveBeenCalledWith(
          'zivktestsapling1p5rp2czztl8amalqm5ghzvhr35n08h26vhphnw2x6k83trft7sqsn9qkd6',
          'whenkeyisnew',
          0,
          'ztestsapling16e4wekqjyx80yjjzf24ztyflt2c5tt6avt4nftgnj694n8e5x8fz5pr9ejsd3l9lmymf29khjnk'
        )
      })

      it('terminates submission', async () => {
        await store.dispatch(epics.createVault(formValues, formActions))

        expect(formActions.setSubmitting).toHaveBeenCalledWith(false)
      })
    })
  })
})

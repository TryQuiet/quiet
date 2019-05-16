/* eslint import/first: 0 */
jest.mock('../../vault')
import Immutable from 'immutable'

import { actions, epics, initialState, actionTypes } from './vault'
import { typePending } from './utils'
import create from '../create'
import vault from '../../vault'
import vaultSelectors from '../selectors/vault'
import { NodeState } from './node'

describe('vault reducer', () => {
  let store = null
  beforeEach(() => {
    jest.clearAllMocks()
    store = create()
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
    const identityObj = { name: 'Saturn', addres: 'testaddress' }
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
  })
})

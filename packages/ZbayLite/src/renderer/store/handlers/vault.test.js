/* eslint import/first: 0 */
jest.mock('../../vault', () => ({
  create: jest.fn(async () => null),
  unlock: jest.fn(async () => null),
  exists: jest.fn(() => 'test')
}))

import { actions, initialState, actionTypes } from './vault'
import { typePending } from './utils'
import create from '../create'
import vault from '../../vault'

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
    await store.dispatch(actions.unlockVault())
    assertStoreState()
  })

  it('handles unlockVault with unlocking state', async () => {
    store.dispatch({ type: typePending(actionTypes.UNLOCK) })
    assertStoreState()
  })

  it('handles unlockVault error', async () => {
    vault.unlock.mockImplementationOnce(async () => { throw Error('This is a test error') })
    try {
      await store.dispatch(actions.unlockVault())
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
})

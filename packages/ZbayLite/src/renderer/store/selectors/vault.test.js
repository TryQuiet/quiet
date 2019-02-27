/* eslint import/first: 0 */
jest.mock('../../vault', () => ({
  create: jest.fn(async () => null),
  unlock: jest.fn(async () => null),
  exists: jest.fn(() => false)
}))

import selectors from './vault'
import vault from '../../vault'
import create from '../create'
import { actions, actionTypes } from '../handlers/vault'
import { typePending } from '../handlers/utils'

describe('vault selectors', () => {
  let store = null
  beforeEach(() => {
    store = create()
    jest.clearAllMocks()
  })

  it('exists', async () => {
    expect(selectors.exists(store.getState())).toEqual(false)
    await store.dispatch(actions.createVault())
    expect(selectors.exists(store.getState())).toEqual(true)
  })

  it('locked', async () => {
    expect(selectors.locked(store.getState())).toEqual(true)
    await store.dispatch(actions.unlockVault())
    expect(selectors.locked(store.getState())).toEqual(false)
  })

  it('error', async () => {
    const errorMsg = 'create error'
    vault.create.mockImplementationOnce(async () => { throw Error(errorMsg) })
    expect(selectors.error(store.getState())).toEqual('')
    try {
      await store.dispatch(actions.createVault())
    } catch (err) {}
    expect(selectors.error(store.getState())).toEqual(errorMsg)
  })

  it('creating', async () => {
    expect(selectors.creating(store.getState())).toEqual(false)
    await store.dispatch({ type: typePending(actionTypes.CREATE) })
    expect(selectors.creating(store.getState())).toEqual(true)
  })

  it('unlocking', async () => {
    expect(selectors.unlocking(store.getState())).toEqual(false)
    await store.dispatch({ type: typePending(actionTypes.UNLOCK) })
    expect(selectors.unlocking(store.getState())).toEqual(true)
  })
})

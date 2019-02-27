/* eslint import/first: 0 */
jest.mock('../../vault', () => ({
  create: jest.fn(async () => null),
  unlock: jest.fn(async () => null),
  exists: jest.fn(() => false)
}))

import selectors from './vaultUnlocker'
import create from '../create'
import { actions, VaultUnlockerState } from '../handlers/vaultUnlocker'
import { mockEvent } from '../../../shared/testing/mocks'

describe('vault selectors', () => {
  let store = null
  beforeEach(() => {
    store = create()
    jest.clearAllMocks()
  })

  it('creator', async () => {
    expect(selectors.unlocker(store.getState())).toEqual(VaultUnlockerState())
  })

  it('password', () => {
    const password = 'test password'
    expect(selectors.password(store.getState())).toEqual('')
    store.dispatch(actions.setPassword(mockEvent(password)))
    expect(selectors.password(store.getState())).toEqual(password)
  })

  it('passwordVisible', () => {
    expect(selectors.passwordVisible(store.getState())).toEqual(false)
    store.dispatch(actions.togglePasswordVisibility())
    expect(selectors.passwordVisible(store.getState())).toEqual(true)
  })
})

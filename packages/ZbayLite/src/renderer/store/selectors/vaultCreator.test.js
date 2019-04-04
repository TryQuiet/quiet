/* eslint import/first: 0 */
jest.mock('../../vault')

import selectors from './vaultCreator'
import create from '../create'
import { actions, VaultCreatorState } from '../handlers/vaultCreator'
import { mockEvent } from '../../../shared/testing/mocks'

describe('vault selectors', () => {
  let store = null
  beforeEach(() => {
    store = create()
    jest.clearAllMocks()
  })

  it('creator', async () => {
    expect(selectors.creator(store.getState())).toEqual(VaultCreatorState())
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

  it('repeat', () => {
    const password = 'test repeat'
    expect(selectors.repeat(store.getState())).toEqual('')
    store.dispatch(actions.setRepeat(mockEvent(password)))
    expect(selectors.repeat(store.getState())).toEqual(password)
  })

  it('repeatVisible', () => {
    expect(selectors.repeatVisible(store.getState())).toEqual(false)
    store.dispatch(actions.toggleRepeatVisibility())
    expect(selectors.repeatVisible(store.getState())).toEqual(true)
  })
})

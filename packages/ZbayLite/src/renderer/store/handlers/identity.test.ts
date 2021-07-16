/* eslint import/first: 0 */
jest.mock('../../../shared/migrations/0_2_0')
jest.mock('../../zcash')
jest.mock('../../../shared/electronStore', () => ({
  set: () => {},
  get: () => {}
}))
jest.mock('electron', () => {
  // @ts-expect-error
  const remote = jest.mock()
  // @ts-expect-error
  const ipcRenderer = jest.mock()
  // @ts-expect-error
  remote.app = jest.mock()
  // @ts-expect-error
  remote.process = jest.mock()
  // @ts-expect-error
  remote.process.on = jest.fn()
  // @ts-expect-error
  remote.app.getVersion = jest.fn().mockReturnValue('0.13.37')
  // @ts-expect-error
  ipcRenderer.on = jest.fn().mockReturnValue('ok')
  // @ts-expect-error
  ipcRenderer.send = jest.fn().mockReturnValue('ok')
  return { remote, ipcRenderer }
})

import create from '../create'
import identityHandlers, { initialState } from './identity'
import identitySelectors from '../selectors/identity'
import each from 'jest-each'

describe('Identity reducer handles', () => {
  const identity = {
    name: 'Saturn',
    id: 'test-id',
    address: 'testaddress',
    signerPrivKey: 'test-hex-key',
    signerPubKey: 'test-hex-key',
    transparentAddress: 'transparent-test-address',
    keys: {
      sk: 'sapling-private-key',
      tpk: 'transparent-private-key'
    }
  }

  let store = null
  beforeEach(() => {
    store = create({
      identity: {
        ...initialState
      }
    })
    // remote.app = jest.mock()
    jest.clearAllMocks()
  })

  const assertStoreState = () =>
    expect(identitySelectors.identity(store.getState())).toMatchSnapshot()

  describe('actions', () => {
    it('handles setIdentity', () => {
      store.dispatch(identityHandlers.actions.setIdentity(identity))
      assertStoreState()
    })

    each([true, false]).test(
      'handles setFetchingBalance to %s',
      async fetching => {
        await store.dispatch(
          identityHandlers.actions.setFetchingBalance(fetching)
        )
        assertStoreState()
      }
    )

    it('handles setErrors', async () => {
      await store.dispatch(
        identityHandlers.actions.setErrors(new Error('this is some error').message)
      )
      assertStoreState()
    })
  })
})

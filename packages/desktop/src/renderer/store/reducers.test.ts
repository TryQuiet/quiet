jest.mock('electron-store', () =>
  jest.fn().mockImplementation(() => ({
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
  }))
)

jest.mock('redux-persist-electron-storage', () =>
  jest.fn().mockImplementation(() => ({
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  }))
)

import { communities } from '@quiet/state-manager'
import { StoreKeys } from './store.keys'
import { rootReducer } from './reducers'

describe('rootReducer', () => {
  it('preserves the live socket connection marker when resetting community state', () => {
    const initialState = rootReducer(undefined, { type: '@@INIT' })
    const connectedState = {
      ...initialState,
      [StoreKeys.Socket]: {
        ...initialState[StoreKeys.Socket],
        isConnected: true,
      },
    }

    const nextState = rootReducer(connectedState, communities.actions.resetApp('payload'))

    expect(nextState[StoreKeys.Socket].isConnected).toBe(true)
  })
})

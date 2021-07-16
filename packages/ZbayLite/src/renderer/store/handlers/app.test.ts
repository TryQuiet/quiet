/* eslint import/first: 0 */
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
  return { remote, ipcRenderer }
})

import { remote } from 'electron'

import handlers from './app'
import selectors from '../selectors/app'
import create from '../create'

describe('criticalError reducer', () => {
  let store = null
  beforeEach(() => {
    store = create({
      initialState: {
        app: {
          // ...AppState
        }
      }
    })
    // @ts-expect-error
    remote.app = jest.mock()
    jest.clearAllMocks()
  })

  describe('handles actions -', () => {
    it('loadVersion', () => {
      store.dispatch(handlers.actions.loadVersion())
      console.log(selectors.version(store.getState()))
      expect(selectors.version(store.getState())).toMatchSnapshot()
    })
  })
})

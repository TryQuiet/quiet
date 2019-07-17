/* eslint import/first: 0 */
import Immutable from 'immutable'

import selectors from './app'
import { AppState } from '../handlers/app'

import create from '../create'

describe('app -', () => {
  let store = null
  beforeEach(() => {
    jest.clearAllMocks()
    store = create({
      initialState: Immutable.Map({
        app: AppState({
          version: '0.13.37'
        })
      })
    })
  })

  it('version selector', async () => {
    expect(selectors.version(store.getState())).toMatchSnapshot()
  })
})

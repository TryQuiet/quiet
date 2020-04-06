/* eslint import/first: 0 */
import Immutable from 'immutable'

import selectors from './logs'
import { Logs } from '../handlers/logs'

import create from '../create'

describe('logs selector', () => {
  let store = null
  beforeEach(() => {
    jest.clearAllMocks()
    store = create({
      initialState: Immutable.Map({
        logsData: Logs()
      })
    })
  })

  it('applicationLogs selector', async () => {
    expect(selectors.applicationLogs(store.getState())).toMatchSnapshot()
  })

  it('transactionsLogs selector', async () => {
    expect(selectors.transactionsLogs(store.getState())).toMatchSnapshot()
  })

  it('nodeLogs selector', async () => {
    expect(selectors.nodeLogs(store.getState())).toMatchSnapshot()
  })

  it('islogsFileLoaded selector', async () => {
    expect(selectors.islogsFileLoaded(store.getState())).toMatchSnapshot()
  })

  it('isLogWindowOpened selector', async () => {
    expect(selectors.isLogWindowOpened(store.getState())).toMatchSnapshot()
  })
})

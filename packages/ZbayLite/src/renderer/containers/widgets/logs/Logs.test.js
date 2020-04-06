import Immutable from 'immutable'

import create from '../../../store/create'
import { mapDispatchToProps, mapStateToProps } from './Logs'
import { Logs } from '../../../store/handlers/logs'

describe('Logs ', () => {
  let store = null
  beforeEach(() => {
    store = create({
      initialState: Immutable.Map({
        logsData: Logs({
          data: Immutable.fromJS({
            transactionLogs: [],
            rpcCallsLogs: [],
            nodeLogs: [],
            islogsFileLoaded: false,
            isLogWindowOpened: false
          })
        })
      })
    })
    jest.clearAllMocks()
  })

  it('will receive right props', () => {
    const state = mapStateToProps(store.getState())
    expect(state).toMatchSnapshot()
  })

  it('will receive right actions', () => {
    const actions = mapDispatchToProps(x => x)
    expect(actions).toMatchSnapshot()
  })
})

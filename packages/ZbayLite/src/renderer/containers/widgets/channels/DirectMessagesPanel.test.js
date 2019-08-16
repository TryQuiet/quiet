import Immutable from 'immutable'

import { mapStateToProps, mapDispatchToProps } from './DirectMessagesPanel'
import create from '../../../store/create'

describe('ChannelsPanel', () => {
  let store = null

  beforeEach(() => {
    jest.clearAllMocks()
    store = create({
      initialState: Immutable.fromJS({
        contacts: {
          address123: {
            username: 'testusername'
          }
        }
      })
    })
  })

  it('will receive right props', async () => {
    const props = mapStateToProps(store.getState())
    expect(props).toMatchSnapshot()
  })

  it('will receive right actions', () => {
    const actions = mapDispatchToProps(x => x)
    expect(actions).toMatchSnapshot()
  })
})

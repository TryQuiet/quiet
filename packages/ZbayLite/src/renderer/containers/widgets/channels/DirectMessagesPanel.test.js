import Immutable from 'immutable'

import { mapStateToProps } from './DirectMessagesPanel'
import create from '../../../store/create'
import { IdentityState } from '../../../store/handlers/identity'
import { LoaderState } from '../../../store/handlers/utils'
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
        },
        identity: IdentityState({
          loader: LoaderState({ loading: false })
        })
      })
    })
  })

  it('will receive right props', async () => {
    const props = mapStateToProps(store.getState())
    expect(props).toMatchSnapshot()
  })
})

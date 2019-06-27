/* eslint import/first: 0 */
import Immutable from 'immutable'

import { mapStateToProps } from './ChannelContent'

import create from '../../../store/create'
import { ChannelState, MessagesState } from '../../../store/handlers/channel'

describe('ChannelContent', () => {
  let store = null
  beforeEach(() => {
    jest.clearAllMocks()
    store = create({
      initialState: Immutable.Map({
        channel: ChannelState({
          messages: MessagesState()
        })
      })
    })
  })

  it('will receive right props', async () => {
    const props = mapStateToProps(store.getState())
    expect(props).toMatchSnapshot()
  })
})

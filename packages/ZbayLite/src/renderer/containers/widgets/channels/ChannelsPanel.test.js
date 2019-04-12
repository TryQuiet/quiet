import Immutable from 'immutable'

import { ChannelsState } from '../../../store/handlers/channels'
import { mapStateToProps } from './ChannelsPanel'
import { createChannel } from '../../../testUtils'
import create from '../../../store/create'

describe('ChannelsPanel', () => {
  let store = null

  beforeEach(() => {
    jest.clearAllMocks()
    store = create({
      initialState: Immutable.Map({
        channels: ChannelsState({
          data: Immutable.fromJS([
            createChannel(1),
            createChannel(2)
          ])
        })
      })
    })
  })

  it('will receive right props', async () => {
    const props = mapStateToProps(store.getState())
    expect(props).toMatchSnapshot()
  })
})

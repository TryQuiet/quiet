/* eslint import/first: 0 */
jest.mock('../../vault')
import Immutable from 'immutable'
import * as R from 'ramda'

import channelsSelectors from './channels'

import create from '../create'
import { ChannelsState } from '../handlers/channels'
import { createChannel } from '../../testUtils'

describe('Channels', () => {
  let store = null
  beforeEach(() => {
    jest.clearAllMocks()
    store = create({
      initialState: Immutable.Map({
        channels: ChannelsState({
          data: R.range(0, 3).map(
            R.compose(
              Immutable.fromJS,
              createChannel
            )
          )
        })
      })
    })
  })

  it('channels selector', async () => {
    expect(channelsSelectors.channels(store.getState())).toMatchSnapshot()
  })
})

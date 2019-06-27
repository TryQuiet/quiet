/* eslint import/first: 0 */
jest.mock('../../vault')
import Immutable from 'immutable'
import * as R from 'ramda'

import channelsSelectors from './channels'

import create from '../create'
import { ChannelsState } from '../handlers/channels'
import { createChannel } from '../../testUtils'
import { LoaderState } from '../handlers/utils'

describe('Channels selectors', () => {
  let store = null
  beforeEach(() => {
    jest.clearAllMocks()
    store = create({
      initialState: Immutable.Map({
        channels: ChannelsState({
          loader: LoaderState({
            loading: true,
            message: 'Loading messages'
          }),
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

  it('- channels', async () => {
    expect(channelsSelectors.channels(store.getState())).toMatchSnapshot()
  })

  it('- loader', async () => {
    expect(channelsSelectors.loader(store.getState())).toMatchSnapshot()
  })
})

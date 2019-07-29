/* eslint import/first: 0 */
jest.mock('../../vault')
import Immutable from 'immutable'
import * as R from 'ramda'

import channelsSelectors from './channels'

import create from '../create'
import zbayChannels from '../../zcash/channels'
import channelsHandlers, { ChannelsState } from '../handlers/channels'
import { NodeState } from '../handlers/node'
import { createChannel, now } from '../../testUtils'
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
          data: Immutable.fromJS(
            R.range(0, 3).map(createChannel)
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

  it('- generalChannelId', async () => {
    const id = 'general-channel-id'
    store = create({
      initialState: Immutable.Map({
        node: NodeState({
          isTestnet: true
        }),
        channels: ChannelsState({
          data: [
            Immutable.fromJS({
              ...zbayChannels.general.testnet,
              id
            })
          ]
        })
      })

    })
    const retrievedId = channelsSelectors.generalChannelId(store.getState())
    expect(retrievedId).toEqual(id)
  })

  it('- channelById', async () => {
    const channel = channelsSelectors.channelById(1)(store.getState())
    expect(channel).toMatchSnapshot()
  })

  it('- lastSeen', () => {
    store.dispatch(channelsHandlers.actions.setLastSeen({
      channelId: 1,
      lastSeen: now.minus({ years: 2 })
    }))

    const updated = channelsSelectors.lastSeen(1)(store.getState())
    expect(updated).toEqual(now.minus({ years: 2 }))
  })
})

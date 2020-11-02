/* eslint import/first: 0 */
import * as R from 'ramda'

import channelsSelectors from './channels'

import create from '../create'
import zbayChannels from '../../zcash/channels'
import channelsHandlers, { ChannelsState } from '../handlers/channels'
import { NodeState } from '../handlers/node'
import { createChannel, now } from '../../testUtils'

describe('Channels selectors', () => {
  let store = null
  beforeEach(() => {
    jest.clearAllMocks()
    store = create({
      initialState: {
        node: {
          ...NodeState,
          isTestnet: true
        },
        channels: {
          ...ChannelsState,
          loader: {
            loading: true,
            message: 'Loading messages'
          },
          data: [{
            ...zbayChannels.store.testnet
          },
          {
            ...zbayChannels.general.testnet
          },
          ...R.range(0, 3).map(createChannel)
          ]
        }
      }
    })
  })

  it('- channels', async () => {
    expect(channelsSelectors.channels(store.getState())).toMatchSnapshot()
  })
  it('- ownedChannels', async () => {
    expect(channelsSelectors.ownedChannels(store.getState())).toMatchSnapshot()
  })

  it('- loader', async () => {
    expect(channelsSelectors.loader(store.getState())).toMatchSnapshot()
  })

  it('- generalChannelAddress', async () => {
    const address = zbayChannels.general.testnet.address
    store = create({
      initialState: {
        node: {
          ...NodeState,
          isTestnet: true
        },
        channels: {
          ...ChannelsState,
          data: [{
            ...zbayChannels.general.testnet
          }
          ]
        }
      }
    })
    const retrievedId = channelsSelectors.generalChannelId(store.getState())
    expect(retrievedId).toEqual(address)
  })
  it('- priceOracleChannel', async () => {
    const id = 'priceOracleChannel'
    store = create({
      initialState: {
        node: {
          ...NodeState,
          isTestnet: true
        },
        channels: {
          data: [
            {
              ...zbayChannels.priceOracle.testnet,
              id
            }
          ]
        }
      }
    })
    const channel = channelsSelectors.priceOracleChannel(store.getState())
    expect(channel).toMatchSnapshot()
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

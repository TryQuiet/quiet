import { createSelector } from 'reselect'

import zcashChannels from '../../zcash/channels'
import nodeSelectors from './node'

const store = s => s

const channels = createSelector(store, state => state.get('channels'))
const data = createSelector(channels, ch => ch.data)
const loader = createSelector(channels, ch => ch.loader)
const errors = createSelector(channels, c => c.get('errors'))

const generalChannelId = createSelector(
  data,
  nodeSelectors.network,
  (ch, network) => {
    const generalChannel = ch.find(
      c => c.get('address') === zcashChannels.general[network].address
    )
    return generalChannel && generalChannel.get('id')
  }
)

const channelById = id => createSelector(
  data,
  (ch) => ch.find(c => c.get('id') === id)
)

export default {
  channelById,
  generalChannelId,
  channels,
  loader,
  data,
  errors
}

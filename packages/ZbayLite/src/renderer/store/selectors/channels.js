import { createSelector } from 'reselect'

import zcashChannels from '../../zcash/channels'
import nodeSelectors from './node'

const ignoredChannels = network => [
  zcashChannels.registeredUsers[network].address,
  zcashChannels.channelOfChannels[network].address,
  zcashChannels.priceOracle[network].address
]
const store = s => s
const channels = createSelector(
  store,
  nodeSelectors.network,
  (state, network) => {
    return state
      .get('channels')
      .updateIn(['data'], channel =>
        channel.filter(
          channel => !ignoredChannels(network).includes(channel.get('address'))
        )
      )
  }
)

const data = createSelector(channels, nodeSelectors.network, (ch, network) => {
  let channelsData = ch.data
  if (channelsData.size) {
    const storeId = channelsData.findIndex(
      ch => ch.get('address') === zcashChannels.store[network].address
    )
    const storeChannel = channelsData.get(storeId)
    channelsData = channelsData.delete(storeId).unshift(storeChannel)
    const zbayId = channelsData.findIndex(
      ch => ch.get('address') === zcashChannels.general[network].address
    )
    const zbayChannel = channelsData.get(zbayId)
    channelsData = channelsData.delete(zbayId).unshift(zbayChannel)
  }
  return channelsData
})
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
const usersChannel = createSelector(
  store,
  nodeSelectors.network,
  (state, network) => {
    return state
      .get('channels')
      .updateIn(['data'], channel =>
        channel.find(
          channel =>
            channel.get('address') ===
            zcashChannels.registeredUsers[network].address
        )
      ).data
  }
)
const priceOracleChannel = createSelector(
  store,
  nodeSelectors.network,
  (state, network) => {
    return state
      .get('channels')
      .updateIn(['data'], channel =>
        channel.find(
          channel =>
            channel.get('address') ===
            zcashChannels.priceOracle[network].address
        )
      ).data
  }
)
const publicChannels = createSelector(
  store,
  nodeSelectors.network,
  (state, network) => {
    return state
      .get('channels')
      .updateIn(['data'], channel =>
        channel.find(
          channel =>
            channel.get('address') ===
            zcashChannels.channelOfChannels[network].address
        )
      ).data
  }
)

const channelById = id =>
  createSelector(data, ch => ch.find(c => c.get('id') === id))
const ownedChannels = createSelector(data, ch =>
  ch.filter(c => {
    return c.get('keys').get('sk')
  })
)

const lastSeen = id => createSelector(channelById(id), ch => ch.get('lastSeen'))

export default {
  channelById,
  generalChannelId,
  usersChannel,
  channels,
  loader,
  lastSeen,
  data,
  errors,
  ownedChannels,
  publicChannels,
  priceOracleChannel
}

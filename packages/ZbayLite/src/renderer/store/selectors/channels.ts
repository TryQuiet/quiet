import { createSelector } from 'reselect'

import zcashChannels from '../../zcash/channels'
import nodeSelectors from './node'

const ignoredChannels = network => [
  zcashChannels.registeredUsers[network].address,
  zcashChannels.channelOfChannels[network].address,
  zcashChannels.priceOracle[network].address
]
const store = s => s
const channels = createSelector(store, nodeSelectors.network, (state, network) => {
  return {
    ...state.channels,
    data: state.channels.data.filter(ch => !ignoredChannels(network).includes(ch.address))
  }
})

const data = createSelector(channels, nodeSelectors.network, (ch, network) => {
  const channelsData = ch.data
  if (channelsData.length) {
    const storeId = channelsData.findIndex(
      ch => ch.address === zcashChannels.store[network].address
    )
    const storeChannel = channelsData[storeId]
    channelsData.splice(storeId, 1)
    channelsData.unshift(storeChannel)
    const zbayId = channelsData.findIndex(
      ch => ch.address === zcashChannels.general[network].address
    )
    const zbayChannel = channelsData[zbayId]
    channelsData.splice(zbayId, 1)
    channelsData.unshift(zbayChannel)
  }
  return channelsData
})
const loader = createSelector(channels, ch => ch.loader)
const errors = createSelector(channels, c => c.errors)

const generalChannelId = createSelector(nodeSelectors.network, network => {
  return zcashChannels.general[network].address
})
const usersChannel = createSelector(store, nodeSelectors.network, (state, network) => {
  const temp = {
    ...state.channels,
    data: state.channels.data.find(
      ch => ch.address === zcashChannels.registeredUsers[network].address
    )
  }
  return temp.data
})
const priceOracleChannel = createSelector(store, nodeSelectors.network, (state, network) => {
  const temp = {
    ...state.channels,
    data: state.channels.data.find(ch => ch.address === zcashChannels.priceOracle[network].address)
  }
  return temp.data
})
const publicChannels = createSelector(store, nodeSelectors.network, (state, network) => {
  const temp = {
    ...state.channels,
    data: state.channels.data.find(
      ch => ch.address === zcashChannels.channelOfChannels[network].address
    )
  }
  return temp.data
})

const channelById = id => createSelector(data, ch => ch.find(c => c.id === id))
const ownedChannels = createSelector(data, ch =>
  ch.filter(c => {
    return c.keys.sk
  })
)

const lastSeen = id => createSelector(channelById(id), ch => ch.lastSeen)

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

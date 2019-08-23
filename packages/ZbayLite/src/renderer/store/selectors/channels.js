import { createSelector } from 'reselect'

import zcashChannels from '../../zcash/channels'
import nodeSelectors from './node'
const store = s => s

const channels = createSelector(
  store,
  nodeSelectors.network,
  (state, network) => {
    return state
      .get('channels')
      .updateIn(['data'], channel =>
        channel.filter(
          channel => channel.get('address') !== zcashChannels.registeredUsers[network].address
        )
      )
  }
)

const data = createSelector(
  channels,
  ch => ch.data
)
const loader = createSelector(
  channels,
  ch => ch.loader
)
const errors = createSelector(
  channels,
  c => c.get('errors')
)

const generalChannelId = createSelector(
  data,
  nodeSelectors.network,
  (ch, network) => {
    const generalChannel = ch.find(c => c.get('address') === zcashChannels.general[network].address)
    return generalChannel && generalChannel.get('id')
  }
)

const usersChannelId = createSelector(
  data,
  nodeSelectors.network,
  (ch, network) => {
    const usersChannel = ch.find(
      c => c.get('address') === zcashChannels.registeredUsers[network].address
    )
    return usersChannel && usersChannel.get('id')
  }
)

const channelById = id =>
  createSelector(
    data,
    ch => ch.find(c => c.get('id') === id)
  )

const lastSeen = id =>
  createSelector(
    channelById(id),
    ch => ch.get('lastSeen')
  )

export default {
  channelById,
  generalChannelId,
  usersChannelId,
  channels,
  loader,
  lastSeen,
  data,
  errors
}

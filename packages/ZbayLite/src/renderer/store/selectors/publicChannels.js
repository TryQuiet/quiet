import { createSelector } from 'reselect'

const store = s => s

const publicChannels = createSelector(
  store,
  state => state.get('publicChannels')
)

const publicChannelsByAddress = address =>
  createSelector(
    publicChannels,
    channels => channels.get(address)
  )

export default {
  publicChannelsByAddress,
  publicChannels
}

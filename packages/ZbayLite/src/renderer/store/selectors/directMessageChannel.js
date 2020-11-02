import { createSelector } from 'reselect'

const store = s => s

export const directMessageChannel = createSelector(store, state => state.directMessageChannel)

export const targetRecipientAddress = createSelector(directMessageChannel, d => d.targetRecipientAddress)

export default {
  directMessageChannel,
  targetRecipientAddress
}

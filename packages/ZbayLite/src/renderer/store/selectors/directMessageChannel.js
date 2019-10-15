import { createSelector } from 'reselect'

const store = s => s

export const directMessageChannel = createSelector(store, state => state.get('directMessageChannel'))

export const targetRecipientAddress = createSelector(directMessageChannel, d => d.get('targetRecipientAddress'))

export default {
  directMessageChannel,
  targetRecipientAddress
}

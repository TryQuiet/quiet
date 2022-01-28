import { createSelector } from 'reselect'

import { Store } from '../reducers'

const directMessageChannel = (s: Store) => s.directMessageChannel

export const targetRecipientAddress = createSelector(directMessageChannel, d => d.targetRecipientAddress)

export default {
  directMessageChannel,
  targetRecipientAddress
}

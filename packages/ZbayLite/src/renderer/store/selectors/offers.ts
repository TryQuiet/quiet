import { createSelector } from 'reselect'
import { OffersStore } from '../handlers/offers'

import { Store } from '../reducers'

const offers = (s: Store) => s.offers as OffersStore

const offer = (id: string) => createSelector(offers, a => a[id])
const newMessages = (id: string) => createSelector(offer(id), ch => ch.newMessages)

export default {
  newMessages
}

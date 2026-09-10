import { type ChannelMessage, type ConsumedChannelMessage } from '@quiet/types'
import { type EntityId, type EntityState } from '@reduxjs/toolkit'

export const filterTransportVerifiedMessages = (state: EntityState<ChannelMessage>): EntityState<ChannelMessage> => {
  const ids = state.ids.filter(id => isPersistableMessage(state.entities[id]))
  const entities: EntityState<ChannelMessage>['entities'] = {}
  for (const id of ids) {
    const message = state.entities[id]
    if (message != null) entities[id] = message
  }
  return { ids, entities }
}

export const filterEntityStateByIds = <T>(state: EntityState<T>, retainedIds: Set<EntityId>): EntityState<T> => {
  const ids = state.ids.filter(id => retainedIds.has(id))
  const entities: EntityState<T>['entities'] = {}
  for (const id of ids) {
    const entity = state.entities[id]
    if (entity != null) entities[id] = entity
  }
  return { ids, entities }
}

export const isPersistableMessage = (message: ChannelMessage | undefined | null): boolean =>
  message != null && (message as ConsumedChannelMessage).verified === true

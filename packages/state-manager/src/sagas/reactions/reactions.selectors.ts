import { createSelector } from '@reduxjs/toolkit'
import { type StoreState } from '../store.types'
import { reactionsEntitySelectors } from './reactions.slice'
import { identitySelectors } from '../identity/identity.selectors'
import { userProfileSelectors } from '../users/userProfile/userProfile.selectors'

export interface ReactionGroup {
  emoji: string
  count: number
  nicknames: string[]
  reacted: boolean
}

const selectAllEntries = (state: StoreState) => reactionsEntitySelectors.selectAll(state.Reactions.reactions)

export const selectReactionsForMessage = (targetMessageId: string) =>
  createSelector(
    selectAllEntries,
    identitySelectors.currentIdentity,
    userProfileSelectors.userProfiles,
    (entries, identity, userProfiles): ReactionGroup[] => {
      const forMessage = entries
        .filter(e => e.targetMessageId === targetMessageId)
        .sort((a, b) => a.createdAt - b.createdAt)

      const lastAction: Record<string, Record<string, 'add' | 'remove'>> = {}
      for (const entry of forMessage) {
        if (!lastAction[entry.emoji]) lastAction[entry.emoji] = {}
        lastAction[entry.emoji][entry.userId] = entry.action
      }

      return Object.entries(lastAction)
        .map(([emoji, userActions]) => {
          const activeUserIds = Object.entries(userActions)
            .filter(([, action]) => action === 'add')
            .map(([userId]) => userId)
          return {
            emoji,
            count: activeUserIds.length,
            nicknames: activeUserIds.map(id => userProfiles[id]?.nickname ?? id),
            userIds: activeUserIds,
            reacted: activeUserIds.includes(identity?.userId ?? ''),
          }
        })
        .filter(g => g.count > 0)
    }
  )

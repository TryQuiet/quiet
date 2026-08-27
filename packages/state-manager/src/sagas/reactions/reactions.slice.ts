import { createSlice, createEntityAdapter, type PayloadAction } from '@reduxjs/toolkit'
import { StoreKeys } from '../store.keys'

export interface ReactionEntry {
  id: string
  targetMessageId: string
  emoji: string
  action: 'add' | 'remove'
  userId: string
  createdAt: number
}

export interface SendReactionPayload {
  targetMessageId: string
  emoji: string
  channelId: string
}

const reactionsAdapter = createEntityAdapter<ReactionEntry>()

export class ReactionsState {
  public reactions = reactionsAdapter.getInitialState()
}

export const reactionsSlice = createSlice({
  name: StoreKeys.Reactions,
  initialState: { ...new ReactionsState() },
  reducers: {
    sendReaction: (state, _action: PayloadAction<SendReactionPayload>) => state,
    addReactionEntries: (state, action: PayloadAction<ReactionEntry[]>) => {
      reactionsAdapter.upsertMany(state.reactions, action.payload)
    },
  },
})

export const reactionsActions = reactionsSlice.actions
export const reactionsReducer = reactionsSlice.reducer
export const reactionsEntitySelectors = reactionsAdapter.getSelectors()

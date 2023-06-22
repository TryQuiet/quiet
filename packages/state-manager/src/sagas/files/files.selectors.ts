import { Dictionary } from '@reduxjs/toolkit'
import { createSelector } from 'reselect'
import { currentChannelMessages } from '../publicChannels/publicChannels.selectors'
import { StoreKeys } from '../store.keys'
import { type CreatedSelectors, type StoreState } from '../store.types'
import { downloadStatusAdapter } from './files.adapter'

const filesSlice: CreatedSelectors[StoreKeys.Files] = (state: StoreState) => state[StoreKeys.Files]

export const downloadStatuses = createSelector(filesSlice, state =>
  downloadStatusAdapter.getSelectors().selectEntities(state.downloadStatus)
)

export const filesSelectors = {
  downloadStatuses,
}

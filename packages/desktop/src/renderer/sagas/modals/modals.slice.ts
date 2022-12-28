import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { ModalName } from './modals.types'

export interface OpenModalPayload {
  name: ModalName
  args?: {}
}

export class ModalsInitialState {
  [ModalName.applicationUpdate] = { open: false };
  [ModalName.createChannel] = { open: false };
  [ModalName.accountSettingsModal] = { open: false };
  [ModalName.openexternallink] = { open: false };
  [ModalName.criticalError] = { open: false };
  [ModalName.createUsernameModal] = { open: false };
  [ModalName.channelInfo] = { open: false };
  [ModalName.channelSettingsModal] = { open: false };
  [ModalName.publishChannel] = { open: false };
  [ModalName.joinChannel] = { open: false };
  [ModalName.newMessageSeparate] = { open: false };
  [ModalName.quitApp] = { open: false };
  [ModalName.joinCommunityModal] = { open: false };
  [ModalName.createCommunityModal] = { open: false };
  [ModalName.uploadedFileModal] = { open: false };
  [ModalName.sentryWarningModal] = { open: false };
  [ModalName.loadingPanel] = { open: true }; // Loading modal is open by default and closes on websocket connection
  [ModalName.leaveCommunityModal] = { open: false };
}

export const modalsSlice = createSlice({
  initialState: { ...new ModalsInitialState() },
  name: 'Modals',
  reducers: {
    openModal: (state, action: PayloadAction<OpenModalPayload>) => {
      const name = action.payload.name
      const args = action.payload.args
      state[name].open = true
      if (args) state[name].args = args
    },
    closeModal: (state, action: PayloadAction<ModalName>) => {
      state[action.payload].open = false
      state[action.payload].args = undefined
    }
  }
})

export const modalsActions = modalsSlice.actions
export const modalsReducer = modalsSlice.reducer

import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { ModalName } from './modals.types'

export interface OpenModalPayload {
  name: ModalName
  args?: {} // eslint-disable-line @typescript-eslint/ban-types
}

export interface ModalState {
  open: boolean
  args?: {} // eslint-disable-line @typescript-eslint/ban-types
}

export class ModalsInitialState {
  [ModalName.applicationUpdate] = { open: false, args: {} };
  [ModalName.createChannel] = { open: false, args: {} };
  [ModalName.deleteChannel] = { open: false, args: {} };
  [ModalName.accountSettingsModal] = { open: false, args: {} };
  [ModalName.openexternallink] = { open: false, args: {} };
  [ModalName.criticalError] = { open: false, args: {} };
  [ModalName.createUsernameModal] = { open: false, args: {} };
  [ModalName.channelInfo] = { open: false, args: {} };
  [ModalName.channelSettingsModal] = { open: false, args: {} };
  [ModalName.publishChannel] = { open: false, args: {} };
  [ModalName.joinChannel] = { open: false, args: {} };
  [ModalName.newMessageSeparate] = { open: false, args: {} };
  [ModalName.quitApp] = { open: false, args: {} };
  [ModalName.joinCommunityModal] = { open: false, args: {} };
  [ModalName.createCommunityModal] = { open: false, args: {} };
  [ModalName.uploadedFileModal] = { open: false, args: {} };
  [ModalName.sentryWarningModal] = { open: false, args: {} };
  [ModalName.leaveCommunity] = { open: false, args: {} };
  [ModalName.searchChannelModal] = { open: false, args: {} };
  [ModalName.warningModal] = { open: false, args: {} };
  [ModalName.loadingPanel] = { open: true, args: {} }; // Loading modal is open by default and closes on websocket connection
  [ModalName.channelCreationModal] = { open: false, args: {} };
  [ModalName.breakingChangesWarning] = { open: false, args: {} };
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
      state[action.payload].args = {}
    },
  },
})

export const modalsActions = modalsSlice.actions
export const modalsReducer = modalsSlice.reducer

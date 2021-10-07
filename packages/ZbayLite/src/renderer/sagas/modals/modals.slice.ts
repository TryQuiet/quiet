import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { ModalName } from './modals.types'

export class ModalsInitialState {
  [ModalName.createChannel]: boolean = false;
  [ModalName.accountSettingsModal]: boolean = false;
  [ModalName.openexternallink]: boolean = false;
  [ModalName.seedModal]: boolean = false;
  [ModalName.criticalError]: boolean = false;
  [ModalName.createUsernameModal]: boolean = false;
  [ModalName.channelInfo]: boolean = false;
  [ModalName.channelSettingsModal]: boolean = false;
  [ModalName.publishChannel]: boolean = false;
  [ModalName.joinChannel]: boolean = false;
  [ModalName.newMessageSeparate]: boolean = false;
  [ModalName.quitApp]: boolean = false
}

export const modalsSlice = createSlice({
  initialState: { ...new ModalsInitialState() },
  name: 'Modals',
  reducers: {
    openModal: (state, action: PayloadAction<ModalName>) => {
      state[action.payload] = true
    },
    closeModal: (state, action: PayloadAction<ModalName>) => {
      state[action.payload] = false
    }
  }
})

export const modalsActions = modalsSlice.actions
export const modalsReducer = modalsSlice.reducer

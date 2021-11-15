import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { CreateUsernameModalProps } from '../../containers/widgets/createUsernameModal/CreateUsername'
import { ModalName } from './modals.types'

export interface OpenModalPayload {
  name: ModalName
  args?: CreateUsernameModalProps | { message: string }
}

export class ModalsInitialState {
  [ModalName.createChannel] = { open: false };
  [ModalName.accountSettingsModal] = { open: false };
  [ModalName.openexternallink] = { open: false };
  [ModalName.seedModal] = { open: false };
  [ModalName.criticalError] = { open: false };
  [ModalName.createUsernameModal]: {
    open: boolean
    args: CreateUsernameModalProps
  } = {
    open: false,
    args: undefined
  };

  [ModalName.channelInfo] = { open: false };
  [ModalName.channelSettingsModal] = { open: false };
  [ModalName.publishChannel] = { open: false };
  [ModalName.joinChannel] = { open: false };
  [ModalName.newMessageSeparate] = { open: false };
  [ModalName.quitApp] = { open: false };
  [ModalName.joinCommunityModal] = { open: false };
  [ModalName.createCommunityModal] = { open: false };
  [ModalName.sentryWarningModal] = { open: false };
  [ModalName.loadingPanel]: {
    open: boolean
    args: { message: string }
  } = {
    open: false,
    args: undefined
  }
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

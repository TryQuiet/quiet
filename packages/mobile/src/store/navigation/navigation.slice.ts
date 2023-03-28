import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { StoreKeys } from '../store.keys'
import { ScreenNames } from '../../const/ScreenNames.enum'
import { MenuName } from '../../const/MenuNames.enum'

export class NavigationState {
  public currentScreen: ScreenNames = ScreenNames.SplashScreen
  public confirmationBox = {
    open: false,
    args: undefined
  }

  public [MenuName.Community] = { open: false, args: undefined }
  public [MenuName.Invitation] = { open: false, args: undefined }
}

export interface NavigationPayload {
  screen: ScreenNames
  params?: any
}

export interface OpenMenuPayload {
  menu: MenuName
  args?: {}
}

export interface ToggleConfirmationBoxPayload {
  open: boolean
  args?: {
    title: string
    duration?: number
  }
}

export const navigationSlice = createSlice({
  initialState: { ...new NavigationState() },
  name: StoreKeys.Navigation,
  reducers: {
    redirection: state => state,
    navigation: (state, action: PayloadAction<NavigationPayload>) => {
      const { screen } = action.payload
      state.currentScreen = screen
    },
    // Replace screen overrides last screen in backstack
    replaceScreen: (state, action: PayloadAction<NavigationPayload>) => {
      const { screen } = action.payload
      state.currentScreen = screen
    },
    openMenu: (state, action: PayloadAction<OpenMenuPayload>) => {
      const { menu, args } = action.payload
      state[menu].open = true
      if (args) {
        state[menu].args = args
      }
    },
    closeMenu: (state, action: PayloadAction<MenuName>) => {
      const menu = action.payload
      state[menu] = {
        open: false,
        args: undefined
      }
    },
    toggleConfirmationBox: (state, action: PayloadAction<ToggleConfirmationBoxPayload>) => {
      const { open, args } = action.payload

      state.confirmationBox.open = open

      if (args) {
        state.confirmationBox.args = args
      }
    }
  }
})

export const navigationActions = navigationSlice.actions
export const navigationReducer = navigationSlice.reducer

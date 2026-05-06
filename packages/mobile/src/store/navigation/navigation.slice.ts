import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { StoreKeys } from '../store.keys'
import { ScreenNames } from '../../const/ScreenNames.enum'
import { MenuName } from '../../const/MenuNames.enum'
import { createLogger } from '../../utils/logger'

const logger = createLogger('navigation:slice')

export class NavigationState {
  public backStack: ScreenNames[] = [ScreenNames.SplashScreen]
  public confirmationBox: ConfirmationBox = {
    open: false,
    args: {},
  }

  public [MenuName.Community] = { open: false, args: {} }
  public [MenuName.Channel] = { open: false, args: {} }
  public [MenuName.Invitation] = { open: false, args: {} }
  public [MenuName.UnregisteredUsername] = { open: false, args: {} }
  public pendingNavigation: ScreenNames | null = null
}

interface ConfirmationBox {
  open: boolean
  args?: {
    title?: string
    duration?: number
  }
}

export interface NavigationPayload {
  screen: ScreenNames
  params?: any
}

export interface PendingNavigationPayload {
  screen: ScreenNames
}

export interface OpenMenuPayload {
  menu: MenuName
  args?: Record<string, unknown>
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
      logger.info(`Navigating to ${screen}`)
      logger.info('Backstack before navigation:', state.backStack.join(' -> '))
      state.backStack.push(screen)
      logger.info('Backstack after navigation:', state.backStack.join(' -> '))
    },
    // Replace screen overrides last screen in backstack
    replaceScreen: (state, action: PayloadAction<NavigationPayload>) => {
      const { screen } = action.payload
      logger.info('Backstack before replace:', state.backStack.join(' -> '))
      state.backStack = [...state.backStack.slice(0, -1), screen]
      logger.info(`Backstack after replace: ${state.backStack.join(' -> ')}`)
    },
    pop: state => {
      logger.info('Backstack before pop:', state.backStack.join(' -> '))
      state.backStack = [...state.backStack.slice(0, -1)]
      logger.info('Backstack after pop:', state.backStack.join(' -> '))
    },
    clearBackStack: state => {
      logger.info('Clearing backstack')
      logger.info(`Backstack before clear: ${state.backStack.join(' -> ')}`)
      state.backStack = state.backStack.slice(-1)
      logger.info(`Backstack after clear: ${state.backStack.join(' -> ')}`)
    },
    setPendingNavigation: (state, action: PayloadAction<PendingNavigationPayload>) => {
      const { screen } = action.payload
      state.pendingNavigation = screen
      logger.info(`Set pending navigation to ${screen}`)
    },
    clearPendingNavigation: state => {
      state.pendingNavigation = null
      logger.info('Cleared pending navigation')
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
        args: {},
      }
    },
    toggleConfirmationBox: (state, action: PayloadAction<ToggleConfirmationBoxPayload>) => {
      const { open, args } = action.payload

      state.confirmationBox.open = open

      if (args) {
        state.confirmationBox.args = args
      }
    },
  },
})

export const navigationActions = navigationSlice.actions
export const navigationReducer = navigationSlice.reducer

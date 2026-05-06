import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { StoreKeys } from '../store.keys'
import { MenuName } from '../../../const/MenuNames.enum'

export class NavigationState {
  public [MenuName.Channel] = { open: false, args: {} }
  public [MenuName.UserProfile] = { open: false, args: {} }
}

export interface OpenMenuPayload {
  menu: MenuName
  args?: {} // eslint-disable-line @typescript-eslint/ban-types
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
    closeAllMenus: state => {
      Object.values(MenuName).forEach(menu => {
        state[menu] = {
          open: false,
          args: {},
        }
      })
    },
  },
})

export const navigationActions = navigationSlice.actions
export const navigationReducer = navigationSlice.reducer

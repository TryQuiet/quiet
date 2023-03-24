import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { StoreKeys } from '../store.keys'
import { ScreenNames } from '../../const/ScreenNames.enum'
import { MenuName } from '../../const/MenuNames.enum'

export class NavigationState {
    public currentScreen: ScreenNames = ScreenNames.SplashScreen
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
        }
    }
})

export const navigationActions = navigationSlice.actions
export const navigationReducer = navigationSlice.reducer

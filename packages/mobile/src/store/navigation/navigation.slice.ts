import { NavigationContainerRef } from '@react-navigation/native'
import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { StoreKeys } from '../store.keys'
import { ScreenNames } from '../../const/ScreenNames.enum'

export class NavigationState {
    public navigationReady: Boolean = false
    public currentScreen: ScreenNames = ScreenNames.SplashScreen
}

export interface NavigationReadyPayload {
    navigationContainer: NavigationContainerRef
}

export interface ReplaceScreenPayload {
    screen: ScreenNames,
    params?: any
}

export const navigationSlice = createSlice({
    initialState: { ...new NavigationState() },
    name: StoreKeys.Navigation,
    reducers: {
        navigationReady: (state, _action: PayloadAction<NavigationReadyPayload>) => {
            state.navigationReady = true
        },
        replaceScreen: (state, action: PayloadAction<ReplaceScreenPayload>) => {
            const { screen } = action.payload
            state.currentScreen = screen
        }
    }
})

export const navigationActions = navigationSlice.actions
export const navigationReducer = navigationSlice.reducer

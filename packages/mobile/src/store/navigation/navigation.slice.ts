import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { StoreKeys } from '../store.keys'
import { ScreenNames } from '../../const/ScreenNames.enum'

export class NavigationState {
    public currentScreen: ScreenNames = ScreenNames.SplashScreen
}

export interface NavigationPayload {
    screen: ScreenNames
    params?: any
}

export const navigationSlice = createSlice({
    initialState: { ...new NavigationState() },
    name: StoreKeys.Navigation,
    reducers: {
        redirection: state => state,
        navigation: (state, action: PayloadAction<NavigationPayload>) => {
            const { screen } = action.payload
            state.currentScreen = screen
        }
    }
})

export const navigationActions = navigationSlice.actions
export const navigationReducer = navigationSlice.reducer

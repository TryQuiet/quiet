import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { StoreKeys } from '../store.keys'
import { ScreenNames } from '../../const/ScreenNames.enum'

export class NavigationState {
    public currentScreen: ScreenNames = ScreenNames.SplashScreen
}

export interface ReplaceScreenPayload {
    screen: ScreenNames,
    params?: any
}

export const navigationSlice = createSlice({
    initialState: { ...new NavigationState() },
    name: StoreKeys.Navigation,
    reducers: {
        displaySplashScreen: state => state,
        replaceScreen: (state, action: PayloadAction<ReplaceScreenPayload>) => {
            console.log('slice replace screen')
            const { screen } = action.payload
            state.currentScreen = screen
        }
    }
})

export const navigationActions = navigationSlice.actions
export const navigationReducer = navigationSlice.reducer

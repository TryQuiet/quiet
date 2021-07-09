import { createSlice, EntityState, PayloadAction } from '@reduxjs/toolkit';
import { ScreenNames } from '../../const/ScreenNames.enum';
import { StoreKeys } from '../store.keys';
import { initChecksAdapter } from './init.adapter';
import { InitCheck } from './init.types';
import { InitCheckKeys } from './initCheck.keys';

export class InitState {
  public isNavigatorReady: boolean = false;
  public isCryptoEngineInitialized: boolean = false;
  public initChecks: EntityState<InitCheck> = initChecksAdapter.setAll(
    initChecksAdapter.getInitialState(),
    [
      {
        event: InitCheckKeys.NativeServices,
        passed: false,
      },
      {
        event: InitCheckKeys.Tor,
        passed: false,
      },
      {
        event: InitCheckKeys.Onion,
        passed: false,
      },
      {
        event: InitCheckKeys.Waggle,
        passed: false,
      },
      {
        event: InitCheckKeys.Websocket,
        passed: false,
      },
    ],
  );
  public currentScreen: ScreenNames = ScreenNames.SplashScreen;
}

export const initSlice = createSlice({
  initialState: { ...new InitState() },
  name: StoreKeys.Init,
  reducers: {
    setNavigatorReady: (state, action: PayloadAction<boolean>) => {
      state.isNavigatorReady = action.payload;
    },
    setCryptoEngineInitialized: (state, action: PayloadAction<boolean>) => {
      state.isCryptoEngineInitialized = action.payload;
    },
    doOnRestore: state => state,
    setStoreReady: state => state,
    updateInitCheck: (state, action: PayloadAction<InitCheck>) => {
      initChecksAdapter.updateOne(state.initChecks, {
        changes: action.payload,
        id: action.payload.event,
      });
    },
    setCurrentScreen: (state, action: PayloadAction<ScreenNames>) => {
      state.currentScreen = action.payload;
    },
  },
});

export const initActions = initSlice.actions;
export const initReducer = initSlice.reducer;

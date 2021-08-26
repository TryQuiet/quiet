import { createSlice, EntityState, PayloadAction } from '@reduxjs/toolkit';
import { ScreenNames } from '../../const/ScreenNames.enum';
import { StoreKeys } from '../store.keys';
import { initChecksAdapter } from './init.adapter';
import { InitCheck } from './init.types';
import { InitCheckKeys } from './initCheck.keys';

export class InitState {
  public dataDirectoryPath: string = '';
  public torData: TorData = {
    socksPort: 0,
    controlPort: 0,
  };
  public hiddenServiceData: OnionData = {
    address: '',
    key: 'NEW:BEST',
    port: 0,
  };
  public isNavigatorReady: boolean = false;
  public isCryptoEngineInitialized: boolean = false;
  public initDescription: string = '';
  public initChecks: EntityState<InitCheck> = initChecksAdapter.setAll(
    initChecksAdapter.getInitialState(),
    [
      {
        event: InitCheckKeys.Tor,
        passed: false,
      },
      {
        event: InitCheckKeys.Waggle,
        passed: false,
      },
    ],
  );
  public currentScreen: ScreenNames = ScreenNames.SplashScreen;
}

export interface TorData {
  socksPort: number;
  controlPort: number;
}

export interface OnionData {
  address: string;
  key: string;
  port: number;
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
    updateInitDescription: (state, action: PayloadAction<string>) => {
      state.initDescription = action.payload;
    },
    onTorInit: (state, action: PayloadAction<TorData>) => {
      const event = InitCheckKeys.Tor;
      initChecksAdapter.updateOne(state.initChecks, {
        changes: {
          event: event,
          passed: true,
        },
        id: event,
      });
      state.torData = action.payload;
    },
    onOnionAdded: (state, action: PayloadAction<OnionData>) => {
      state.hiddenServiceData = action.payload;
    },
    onDataDirectoryCreated: (state, action: PayloadAction<string>) => {
      state.dataDirectoryPath = action.payload;
    },
    onWaggleStarted: (state, _action: PayloadAction<boolean>) => {
      const event = InitCheckKeys.Waggle;
      initChecksAdapter.updateOne(state.initChecks, {
        changes: {
          event: event,
          passed: true,
        },
        id: event,
      });
    },
    setCurrentScreen: (state, action: PayloadAction<ScreenNames>) => {
      state.currentScreen = action.payload;
    },
  },
});

export const initActions = initSlice.actions;
export const initReducer = initSlice.reducer;

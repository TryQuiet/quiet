import { createSlice, EntityState, PayloadAction } from '@reduxjs/toolkit'
import { FixedTask } from 'typed-redux-saga'
import { Socket } from 'socket.io-client'
import { ScreenNames } from '../../const/ScreenNames.enum'
import { StoreKeys } from '../store.keys'
import { initChecksAdapter } from './init.adapter'
import { InitCheck } from './init.types'
import { InitCheckKeys } from './initCheck.keys'

export class InitState {
  public dataDirectoryPath: string = ''
  public torData: TorData = {
    httpTunnelPort: 0,
    socksPort: 0,
    controlPort: 0,
    authCookie: ''
  }

  public isNavigatorReady: boolean = false
  public isCryptoEngineInitialized: boolean = false
  public isConnected: boolean = false
  public initDescription: string = ''
  public initChecks: EntityState<InitCheck> = initChecksAdapter.setAll(
    initChecksAdapter.getInitialState(),
    [
      {
        event: InitCheckKeys.Tor,
        passed: false
      },
      {
        event: InitCheckKeys.Backend,
        passed: false
      }
    ]
  )

  public currentScreen: ScreenNames = ScreenNames.SplashScreen
}

export interface TorData {
  httpTunnelPort: number
  socksPort: number
  controlPort: number
  authCookie: string
}

export interface WebsocketConnectionPayload {
  dataPort: number
}

export interface CloseConnectionPayload {
  task: FixedTask<Generator>
}

export interface SetConnectedPayload {
  socket: Socket
}

export const initSlice = createSlice({
  initialState: { ...new InitState() },
  name: StoreKeys.Init,
  reducers: {
    setNavigatorReady: (state, action: PayloadAction<boolean>) => {
      state.isNavigatorReady = action.payload
    },
    setCryptoEngineInitialized: (state, action: PayloadAction<boolean>) => {
      state.isCryptoEngineInitialized = action.payload
    },
    doOnRestore: state => state,
    setStoreReady: state => state,
    updateInitDescription: (state, action: PayloadAction<string>) => {
      state.initDescription = action.payload
    },
    onTorInit: (state, action: PayloadAction<TorData>) => {
      const event = InitCheckKeys.Tor
      initChecksAdapter.updateOne(state.initChecks, {
        changes: {
          event: event,
          passed: true
        },
        id: event
      })
      state.torData = action.payload
    },
    onDataDirectoryCreated: (state, action: PayloadAction<string>) => {
      state.dataDirectoryPath = action.payload
    },
    onBackendStarted: (state, _action: PayloadAction<WebsocketConnectionPayload>) => state,
    startConnection: (state, _action: PayloadAction<WebsocketConnectionPayload>) => state,
    suspendConnection: state => {
      state.isConnected = false
    },
    setConnected: state => {
      state.isConnected = true
      const event = InitCheckKeys.Backend
      initChecksAdapter.updateOne(state.initChecks, {
        changes: {
          event: event,
          passed: true
        },
        id: event
      })
    },
    setCurrentScreen: (state, action: PayloadAction<ScreenNames>) => {
      state.currentScreen = action.payload
    }
  }
})

export const initActions = initSlice.actions
export const initReducer = initSlice.reducer

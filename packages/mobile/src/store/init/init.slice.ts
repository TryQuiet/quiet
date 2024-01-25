import { createSlice, EntityState, PayloadAction } from '@reduxjs/toolkit'
import { FixedTask } from 'typed-redux-saga'
import { Socket } from 'socket.io-client'
import { StoreKeys } from '../store.keys'
import { initChecksAdapter } from './init.adapter'
import { InitCheck } from './init.types'
import { InitCheckKeys } from './initCheck.keys'

export class InitState {
  public deepLinking: boolean = false
  public isCryptoEngineInitialized: boolean = false
  public isWebsocketConnected: boolean = false
  public lastKnownSocketIOData: WebsocketConnectionPayload = {
    dataPort: 0,
    socketIOSecret: '',
  }
  public initDescription: string = 'Starting Quiet'
  public initChecks: EntityState<InitCheck> = initChecksAdapter.setAll(initChecksAdapter.getInitialState(), [])
  public ready: boolean = false
}

export interface InitCheckPayload {
  event: InitCheckKeys
  passed: boolean
}

export interface WebsocketConnectionPayload {
  dataPort: number
  socketIOSecret: string
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
    setStoreReady: state => {
      state.ready = true
    },
    setCryptoEngineInitialized: (state, action: PayloadAction<boolean>) => {
      state.isCryptoEngineInitialized = action.payload
    },
    updateInitDescription: (state, action: PayloadAction<string>) => {
      state.initDescription = action.payload
    },
    updateInitCheck: (state, action: PayloadAction<InitCheckPayload>) => {
      const { event, passed } = action.payload
      initChecksAdapter.updateOne(state.initChecks, {
        changes: {
          event,
          passed,
        },
        id: event,
      })
    },
    blindWebsocketConnection: state => state,
    startWebsocketConnection: (state, _action: PayloadAction<WebsocketConnectionPayload>) => state,
    suspendWebsocketConnection: state => {
      state.isWebsocketConnected = false
    },
    setWebsocketConnected: (state, action: PayloadAction<WebsocketConnectionPayload>) => {
      state.isWebsocketConnected = true
      state.lastKnownSocketIOData = action.payload
      const event = InitCheckKeys.Backend
      initChecksAdapter.updateOne(state.initChecks, {
        changes: {
          event,
          passed: true,
        },
        id: event,
      })
    },
    deepLink: (state, _action: PayloadAction<string>) => {
      state.deepLinking = true
    },
    resetDeepLink: state => {
      state.deepLinking = false
    },
    canceledRootTask: state => state
  },
})

export const initActions = initSlice.actions
export const initReducer = initSlice.reducer

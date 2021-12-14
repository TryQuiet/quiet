import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { StoreKeys } from '@zbayapp/nectar/lib/sagas/store.keys'

export class SocketState {
  public isConnected: boolean = false
}

export interface WebsocketConnectionPayload {
  dataPort: number
}

export const socketSlice = createSlice({
  initialState: { ...new SocketState() },
  name: StoreKeys.Socket,
  reducers: {
    startConnection: (state, _action: PayloadAction<WebsocketConnectionPayload>) => state,
    closeConnection: state => state,
    setConnected: state => {
      state.isConnected = true
    }
  }
})

export const socketActions = socketSlice.actions
export const socketReducer = socketSlice.reducer

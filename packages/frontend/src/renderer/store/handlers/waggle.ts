
import { actionTypes } from '../../../shared/static'
import { immerable } from 'immer'

import { createAction, createReducer } from '@reduxjs/toolkit'

import { ActionsType } from './types'

export class Waggle {
  isWaggleConnected: boolean

  constructor(values?: Partial<Waggle>) {
    Object.assign(this, values)
    this[immerable] = true
  }
}

export type WaggleStore = Waggle

export const initialState: Waggle = {
  isWaggleConnected: false
}

const setIsWaggleConnected = createAction<boolean>(actionTypes.SET_IS_WAGGLE_CONNECTED)

export const actions = {
  setIsWaggleConnected
}

export type WaggleActions = ActionsType<typeof actions>

export const epics = {}
export const reducer = createReducer<WaggleStore>(initialState, (builder) => {
  builder.addCase(setIsWaggleConnected, (state, action: WaggleActions['setIsWaggleConnected']) => {
    state.isWaggleConnected = action.payload
  })
})

export default {
  actions,
  epics,
  reducer
}

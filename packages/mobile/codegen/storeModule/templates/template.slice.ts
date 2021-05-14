import {storeModuleConst} from '../storeModule.const';

export const template = `
import { createSlice } from '@reduxjs/toolkit'

import { StoreKeys } from '../store.keys'
import { {{ ${storeModuleConst.vars.name} }}Adapter } from './{{ ${storeModuleConst.vars.name} }}.adapter'

export const initial{{ pascalCase ${storeModuleConst.vars.name} }}SliceState = {{ ${storeModuleConst.vars.name} }}Adapter.getInitialState()

export const {{ ${storeModuleConst.vars.name} }}Slice = createSlice({
  initialState: initial{{ pascalCase ${storeModuleConst.vars.name} }}SliceState,
  name: StoreKeys.{{ pascalCase ${storeModuleConst.vars.name} }},
  reducers: {},
})

export const {{ ${storeModuleConst.vars.name} }}Actions = {{ ${storeModuleConst.vars.name} }}Slice.actions
export const {{ ${storeModuleConst.vars.name} }}Reducer = {{ ${storeModuleConst.vars.name} }}Slice.reducer
`;

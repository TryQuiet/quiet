import { storeModuleConst } from '../storeModule.const';
export const template = `
import { createSlice } from '@reduxjs/toolkit';
import { StoreKeys } from '../store.keys';
export class {{ pascalCase ${storeModuleConst.vars.name} }}State {}
export const {{ ${storeModuleConst.vars.name} }}Slice = createSlice({
  initialState: { ...new {{ pascalCase ${storeModuleConst.vars.name} }}State() },
  name: StoreKeys.{{ pascalCase ${storeModuleConst.vars.name} }},
  reducers: {},
});
export const {{ ${storeModuleConst.vars.name} }}Actions = {{ ${storeModuleConst.vars.name} }}Slice.actions;
export const {{ ${storeModuleConst.vars.name} }}Reducer = {{ ${storeModuleConst.vars.name} }}Slice.reducer;
`;

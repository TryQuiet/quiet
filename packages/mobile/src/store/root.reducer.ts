import {testStoreReducer} from './testStore/testStore.slice';
import {combineReducers} from '@reduxjs/toolkit';
import {StoreKeys} from './store.keys';

export const rootReducer = combineReducers({
  [StoreKeys.TestStore]: testStoreReducer,
});

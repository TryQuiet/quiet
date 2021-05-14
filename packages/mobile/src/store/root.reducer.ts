import {sessionReducer} from './session/session.slice';
import {combineReducers} from '@reduxjs/toolkit';
import {StoreKeys} from './store.keys';

export const rootReducer = combineReducers({
  [StoreKeys.Session]: sessionReducer,
});

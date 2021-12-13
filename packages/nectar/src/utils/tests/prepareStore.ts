import { combineReducers, createStore, applyMiddleware } from 'redux';
import createSagaMiddleware from 'redux-saga';
import thunk from 'redux-thunk';
import { StoreKeys } from '../../sagas/store.keys';
import {
  communities,
  identity,
  users,
  errors,
  messages,
  publicChannels,
  connection,
} from '../..';

const reducers = {
  [StoreKeys.Communities]: communities.reducer,
  [StoreKeys.Identity]: identity.reducer,
  [StoreKeys.Users]: users.reducer,
  [StoreKeys.Errors]: errors.reducer,
  [StoreKeys.Messages]: messages.reducer,
  [StoreKeys.PublicChannels]: publicChannels.reducer,
  [StoreKeys.Connection]: connection.reducer,
};

export const prepareStore = (mockedState?: { [key in StoreKeys]?: any }) => {
  const combinedReducers = combineReducers(reducers);
  const sagaMiddleware = createSagaMiddleware();
  const store = createStore(
    combinedReducers,
    mockedState,
    applyMiddleware(...[sagaMiddleware, thunk])
  );

  return {
    store,
    runSaga: sagaMiddleware.run,
  };
};

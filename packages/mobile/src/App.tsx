import React from 'react';
import {Provider as StoreProvider} from 'react-redux';
import {PersistGate} from 'redux-persist/integration/react';
import {rootSaga} from './store/root.saga';
import {persistor, sagaMiddleware, store} from './store/store';

sagaMiddleware.run(rootSaga);

export default function App(): JSX.Element {
  return (
    <StoreProvider store={store}>
      <PersistGate loading={null} persistor={persistor} />
    </StoreProvider>
  );
}

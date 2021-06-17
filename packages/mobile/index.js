/**
 * @format
 */

import React, { lazy, Suspense } from 'react';
import { AppRegistry } from 'react-native';
import { Config } from 'react-native-config';

import { Provider as StoreProvider } from 'react-redux';
import { store } from './src/store/store';

import { name } from './app.json';

import { NodeEnv } from './src/utils/const/NodeEnv.enum';

const App = lazy(() => import('./src/App'));
const Storybook = lazy(() => import('./storybook'));

const Main = Config.NODE_ENV === NodeEnv.Storybook ? Storybook : App;

const Wrapper = () => (
  <Suspense fallback={null}>
    <StoreProvider store={store}>
      <Main />
    </StoreProvider>
  </Suspense>
);

AppRegistry.registerComponent(name, () => Wrapper);

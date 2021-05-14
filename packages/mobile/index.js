/**
 * @format
 */

import React, {lazy, Suspense} from 'react';
import {AppRegistry} from 'react-native';
import {Config} from 'react-native-config';

import {name} from './app.json';

import {NodeEnv} from './src/utils/const/NodeEnv.enum';

const App = lazy(() => import('./src/App'));
const Storybook = lazy(() => import('./storybook'));

const Main = Config.NODE_ENV === NodeEnv.Storybook ? Storybook : App;

const Wrapper = () => (
  <Suspense fallback={null}>
    <Main />
  </Suspense>
);

AppRegistry.registerComponent(name, () => Wrapper);

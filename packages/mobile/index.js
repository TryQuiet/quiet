/**
 * @format
 */

import React, {Suspense} from 'react';
import {AppRegistry} from 'react-native';
import {App} from './src/App';

import {name} from './app.json';

const Wrapper = () => (
  <Suspense fallback={null}>
    <App />
  </Suspense>
);

AppRegistry.registerComponent(name, () => Wrapper);

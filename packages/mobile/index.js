/* eslint-disable import/first */
import './shim'
/**
 * @format
 */
require('node-libs-react-native/globals.js')

import 'react-native-url-polyfill/auto'
// It looks like react-native's JS engine (Hermes) doesn't support the
// TextEncoder API which is required for dag-cbor encoding in
// state-manager. Perhaps react-native will support it at some point:
// https://github.com/facebook/hermes/discussions/1072
import 'fast-text-encoding';

import { AppRegistry } from 'react-native'
import Config from 'react-native-config'

import { name } from './app.json'

import { NodeEnv } from './src/utils/const/NodeEnv.enum'

if (Config.NODE_ENV !== NodeEnv.Storybook) {
  const App = require('./src/App').default
  AppRegistry.registerComponent(name, () => App)
} else {
  const Storybook = require('./.storybook').default
  AppRegistry.registerComponent(name, () => Storybook)
}

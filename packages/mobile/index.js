/* eslint-disable import/first */
import './shim'
/**
 * @format
 */
require('node-libs-react-native/globals.js')

import 'react-native-url-polyfill/auto'
import { AppRegistry } from 'react-native'
import Config from 'react-native-config'
import { name } from './app.json'

import { NodeEnv } from './src/utils/const/NodeEnv.enum'
import StoreProvider from './src/Provider'

if (Config.NODE_ENV !== NodeEnv.Storybook) {
  const { default: App } = require('./src/App')
  AppRegistry.registerComponent(name, () => () => (
    <StoreProvider>
      <App />
    </StoreProvider>
  ))
} else {
  const Storybook = require('./storybook')
  AppRegistry.registerComponent(name, () => Storybook.default)
}

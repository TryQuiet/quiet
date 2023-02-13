/* eslint-disable import/first */
import './shim'
/**
 * @format
 */
require('node-libs-react-native/globals.js')

import { Suspense } from 'react'
import { AppRegistry } from 'react-native'
import Config from 'react-native-config'
import { Provider as StoreProvider } from 'react-redux'
import { name } from './app.json'
import { store } from './src/store/store'
import { NodeEnv } from './src/utils/const/NodeEnv.enum'

import Storybook from './storybook'
import App from './src/App'

const Main = Config.NODE_ENV === NodeEnv.Storybook ? Storybook : App

const Wrapper = () => (
  <Suspense fallback={null}>
    <StoreProvider store={store}>
      <Main />
    </StoreProvider>
  </Suspense>
)

AppRegistry.registerComponent(name, () => Wrapper)

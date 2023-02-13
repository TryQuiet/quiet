import './shim'
/**
 * @format
 */
require('node-libs-react-native/globals.js')

import React, { lazy, Suspense } from 'react'
import { AppRegistry } from 'react-native'
import Config from 'react-native-config'

import { Provider as StoreProvider } from 'react-redux'
import { store } from './src/store/store'

import { name } from './app.json'

import { NodeEnv } from './src/utils/const/NodeEnv.enum'

import Storybook from './storybook'

// Lazy loading main app component doesn't work in storybook
const App = lazy(() => import('./src/App'))

const Main = Config.NODE_ENV === NodeEnv.Storybook ? Storybook : App

const Wrapper = () => (
  <Suspense fallback={null}>
    <StoreProvider store={store}>
      <Main />
    </StoreProvider>
  </Suspense>
)

AppRegistry.registerComponent(name, () => Wrapper)

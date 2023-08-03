/* eslint-disable */
import { setEngine, CryptoEngine } from 'pkijs'
import { Crypto } from '@peculiar/webcrypto'

import { io } from 'socket.io-client'

const webcrypto = new Crypto()
// @ts-ignore
global.crypto = webcrypto
// @ts-ignore
global.window = undefined

setEngine(
  'newEngine',
  webcrypto,
  new CryptoEngine({
    name: '',
    crypto: webcrypto,
    subtle: webcrypto.subtle,
  })
)

jest.mock('react-native-config', () => ({
  NODE_ENV: 'staging',
}))

jest.mock('redux-persist-filesystem-storage', () => {})

jest.mock('redux-persist', () => {
  const real = jest.requireActual('redux-persist')
  return {
    ...real,
    persistReducer: jest.fn().mockImplementation((config, reducers) => reducers),
  }
})

jest.mock('react-native/Libraries/EventEmitter/NativeEventEmitter')

jest.mock('react-native-mathjax-html-to-svg', () => {})

jest.mock('react-native-qrcode-svg', () => jest.fn())

jest.mock('react-native-progress', () => ({
  CircleSnail: jest.fn(),
}))

jest.mock('socket.io-client', () => ({
  io: jest.fn(),
}))

// Mocked because of: "Invariant Violation: TurboModuleRegistry.getEnforcing(...): 'RNDocumentPicker'
// could not be found. Verify that a module by this name is registered in the native binary."
jest.mock('react-native-document-picker', () => {})

export const ioMock = io as jest.Mock

jest.resetAllMocks()

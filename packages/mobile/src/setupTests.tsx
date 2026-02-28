/* eslint-disable */
import { setEngine, CryptoEngine } from 'pkijs'
import { setEngine as setIdentityEngine } from '../../identity/node_modules/pkijs'
import { Crypto } from '@peculiar/webcrypto'
import React from 'react'

import { io } from 'socket.io-client'

const webcrypto = new Crypto()
// https://github.com/lobehub/lobehub/issues/5315#issuecomment-2572703223
Object.defineProperty(global, 'crypto', {
  value: webcrypto,
  writable: true,
})

setEngine(
  'newEngine',
  webcrypto,
  new CryptoEngine({
    name: '',
    crypto: webcrypto,
    subtle: webcrypto.subtle,
  })
)

setIdentityEngine(
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

jest.mock('react-native', () => {
  const rn = jest.requireActual('react-native')
  rn.NativeModules.CommunicationModule = {
    requestNotificationPermission: jest.fn(),
    checkNotificationPermission: jest.fn(),
    handleIncomingEvents: jest.fn(),
  }
  return rn
})

jest.mock('redux-persist-filesystem-storage', () => ({
  config: jest.fn(),
}))

jest.mock('react-native-blob-util', () => ({
  fs: {
    dirs: {
      DocumentDir: 'dir',
    },
  },
}))

jest.mock('react-native-mathjax-html-to-svg', () => {})

jest.mock('react-native-qrcode-svg', () => jest.fn())

jest.mock('react-native-progress', () => ({
  CircleSnail: jest.fn(),
}))

jest.mock('@ronradtke/react-native-markdown-display', () => ({
  __esModule: true,
  default: (props: any) => {
    return <div>{props.children}</div>
  },
  MarkdownIt: jest.fn(),
}))

jest.mock('socket.io-client', () => ({
  io: jest.fn(),
}))

// Mocked because of:
//
// "Invariant Violation: TurboModuleRegistry.getEnforcing(...): 'RNDocumentPicker'
// could not be found. Verify that a module by this name is registered in the native binary."
jest.mock('react-native-document-picker', () => {})

// Mocked because of:
//
// /Users/isla/Dev/quiet/packages/mobile/node_modules/react-native-image-picker/src/index.ts:1
// ({"Object.<anonymous>":function(module,exports,require,__dirname,__filename,jest){import {Platform} from 'react-native';
// ^^^^^^
//
// SyntaxError: Cannot use import statement outside a module
jest.mock('react-native-image-picker', () => {})

jest.mock('react-native-device-info', () => {
  return {
    getVersion: () => {
      return '1.0.0'
    },
  }
})

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => {
    return {
      bottom: 0,
    }
  },
}))

jest.mock('react-native-fs', () => {
  return {
    mkdir: jest.fn(),
    moveFile: jest.fn(),
    copyFile: jest.fn(),
    pathForBundle: jest.fn(),
    pathForGroup: jest.fn(),
    getFSInfo: jest.fn(),
    getAllExternalFilesDirs: jest.fn(),
    unlink: jest.fn(),
    exists: jest.fn(),
    stopDownload: jest.fn(),
    resumeDownload: jest.fn(),
    isResumable: jest.fn(),
    stopUpload: jest.fn(),
    completeHandlerIOS: jest.fn(),
    readDir: jest.fn(),
    readDirAssets: jest.fn(),
    existsAssets: jest.fn(),
    readdir: jest.fn(),
    setReadable: jest.fn(),
    stat: jest.fn(),
    readFile: jest.fn(),
    read: jest.fn(),
    readFileAssets: jest.fn(),
    hash: jest.fn(),
    copyFileAssets: jest.fn(),
    copyFileAssetsIOS: jest.fn(),
    copyAssetsVideoIOS: jest.fn(),
    writeFile: jest.fn(),
    appendFile: jest.fn(),
    write: jest.fn(),
    downloadFile: jest.fn(),
    uploadFiles: jest.fn(),
    touch: jest.fn(),
    MainBundlePath: jest.fn(),
    CachesDirectoryPath: jest.fn(),
    DocumentDirectoryPath: jest.fn(),
    ExternalDirectoryPath: jest.fn(),
    ExternalStorageDirectoryPath: jest.fn(),
    TemporaryDirectoryPath: jest.fn(),
    LibraryDirectoryPath: jest.fn(),
    PicturesDirectoryPath: jest.fn(),
  }
})

jest.mock('react-native-file-logger', () => {
  return {
    FileLogger: {
      configure: jest.fn(),
    },
  }
})

export const ioMock = io as jest.Mock

jest.resetAllMocks()

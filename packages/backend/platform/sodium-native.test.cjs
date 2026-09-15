'use strict'
const test = require('node:test')
const path = require('node:path')
const {createRequire} = require('node:module')
require('./sodium-native.checks.cjs').register(test, async () => {
  if (process.env.QUIET_NATIVE_TEST_BUNDLE) {
    const {webpack} = require(path.resolve(process.env.QUIET_NATIVE_TEST_BUNDLE))
    await webpack('../../3rd-party/auth/packages/crypto/dist/index.js')
    return webpack('../../3rd-party/auth/node_modules/.pnpm/libsodium-wrappers-sumo@0.7.13/node_modules/libsodium-wrappers-sumo/dist/modules-sumo/libsodium-wrappers.js')
  } else {
    const fromLfa = createRequire(path.resolve(__dirname, '../../..', '3rd-party/auth/packages/crypto/package.json'))
    return fromLfa('libsodium-wrappers-sumo')
  }
})

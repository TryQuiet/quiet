// Exercise the installed RN legacy queueMicrotask and Storybook's actual core-js.
// Host V8 needs explicit polyfill selection to enter the replacement branch seen
// on Hermes. This tests that conflict and the prelude, not Hermes compatibility.
const assert = require('node:assert/strict')
const { spawnSync } = require('node:child_process')
const fs = require('node:fs')
const { createRequire } = require('node:module')
const path = require('node:path')
const test = require('node:test')

const projectRoot = path.resolve(__dirname, '..')
const preludePath = path.join(projectRoot, '.storybook/preserve-native-promise.js')
const requireStorybook = createRequire(require.resolve('@storybook/react-native/package.json'))
const requireAddons = createRequire(requireStorybook.resolve('@storybook/addons/package.json'))
const requireStorybookCoreJs = createRequire(requireAddons.resolve('core-js/package.json'))
const promiseModule = requireAddons.resolve('core-js/modules/es.promise.js')

function runChild(fixed) {
  const originalPromise = global.Promise
  const originalThen = originalPromise.prototype.then
  const babel = require('@babel/core')
  const timerPath = require.resolve('react-native/Libraries/Core/Timers/queueMicrotask.js')
  const transformed = babel.transformFileSync(timerPath, {
    babelrc: false,
    configFile: false,
    presets: [require.resolve('@react-native/babel-preset')],
  })
  const timerModule = { exports: {} }
  new Function('module', 'exports', 'require', transformed.code)(
    timerModule,
    timerModule.exports,
    createRequire(timerPath)
  )
  global.queueMicrotask = timerModule.exports.default

  // Select the real core-js replacement branch without pretending Node's native
  // Promise has Hermes' feature-detection behavior. Both cases use identical input.
  requireStorybookCoreJs('./configurator')({ usePolyfill: ['Promise'] })
  if (fixed) require(preludePath)
  require(promiseModule)

  const result = {
    promisePreserved: global.Promise === originalPromise,
    thenPreserved: originalPromise.prototype.then === originalThen,
    microtaskRan: false,
    promiseRan: false,
    timerRan: false,
  }
  const finish = () => {
    fs.writeSync(1, JSON.stringify(result))
    process.exit(0)
  }
  if (!fixed) {
    try {
      global.queueMicrotask(() => {
        result.microtaskRan = true
      })
    } catch (error) {
      result.errorName = error.name
      result.recursiveStack = String(error.stack).includes('queueMicrotask')
    }
    finish()
    return
  }

  // Real asynchronous progress: RN's shim, Promise chaining, and a macrotask
  // must all complete after the Storybook Promise import.
  const order = []
  global.queueMicrotask(() => {
    result.microtaskRan = true
    order.push('microtask')
  })
  global.Promise.resolve('preserved').then(value => {
    result.promiseRan = value === 'preserved'
    order.push('promise')
  })
  order.push('synchronous')
  setTimeout(() => {
    result.timerRan = true
    order.push('timer')
    result.order = order
    finish()
  }, 10)
}

function childResult(mode) {
  // Isolate core-js's global/prototype mutations and bound a future regression
  // that spins rather than throwing. The reduced stack bounds baseline recursion.
  const child = spawnSync(process.execPath, ['--stack-size=512', __filename, '--promise-child', mode], {
    cwd: projectRoot,
    encoding: 'utf8',
    timeout: 10000,
    maxBuffer: 64 * 1024,
  })
  assert.ifError(child.error)
  assert.equal(child.signal, null)
  assert.equal(child.status, 0, child.stderr)
  return JSON.parse(child.stdout)
}

if (process.argv[2] === '--promise-child') {
  runChild(process.argv[3] === 'fixed')
} else {
  test('Storybook Promise replacement recurses through the real RN legacy queueMicrotask', () => {
    const result = childResult('baseline')
    assert.equal(result.promisePreserved, false)
    assert.equal(result.microtaskRan, false)
    assert.equal(result.errorName, 'RangeError')
    assert.equal(result.recursiveStack, true)
  })

  test('the Storybook prelude preserves Promise and real asynchronous progress', () => {
    const result = childResult('fixed')
    assert.equal(result.promisePreserved, true)
    assert.equal(result.thenPreserved, true)
    assert.equal(result.microtaskRan, true)
    assert.equal(result.promiseRan, true)
    assert.equal(result.timerRan, true)
    assert.deepEqual(result.order, ['synchronous', 'microtask', 'promise', 'timer'])
  })
}

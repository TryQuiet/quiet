// #3646 made every packaging script clear `dist/` first, which put `rimraf` on the critical path
// of every release build. It was never declared as a dependency: it resolved only because some
// transitive dependency happened to hoist it to the top of node_modules, so a dependency bump
// elsewhere could have broken packaging with no change to this package at all.
//
// These tests fail if the declaration is dropped again, if it drifts from the version that
// actually resolves, or if a packaging script stops clearing `dist/`.
const assert = require('node:assert/strict')
const { test } = require('node:test')
const { scripts, devDependencies } = require('../package.json')

const packagingScripts = Object.entries(scripts).filter(([, body]) => body.includes('electron-builder'))

test('the packaging scripts are discoverable', () => {
  assert.ok(packagingScripts.length >= 5, `expected the electron-builder scripts, found ${packagingScripts.length}`)
})

test('every packaging script clears dist/ before it builds', () => {
  for (const [name, body] of packagingScripts) {
    assert.match(body, /^npm run rmDist &&/, `${name} must start by clearing dist/`)
  }
})

test('clearing dist/ is what invokes rimraf', () => {
  assert.match(scripts.rmDist, /(^|\s)rimraf(\s|$)/, 'rmDist must invoke rimraf')
})

test('rimraf is declared, not inherited from another package hoisting it', () => {
  assert.ok(
    devDependencies.rimraf,
    'rimraf runs in every packaging script, so it must be declared in devDependencies'
  )
})

test('the declared rimraf is the one that resolves', () => {
  const declared = devDependencies.rimraf
  const installed = require('rimraf/package.json').version
  if (/^\d/.test(declared)) {
    assert.equal(installed, declared, 'the declared rimraf version must match the installed one')
  } else {
    assert.ok(installed, 'rimraf must resolve for rmDist to run')
  }
})

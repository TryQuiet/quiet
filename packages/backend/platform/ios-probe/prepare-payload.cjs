'use strict'
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const {createRequire} = require('node:module')
async function prepare(output, sodiumPath) {
  assert.ok(!fs.existsSync(output), 'Choose a new payload directory')
  const fromSodium = createRequire(sodiumPath)
  const wrapper = path.resolve(path.dirname(sodiumPath), '../..')
  const core = path.resolve(path.dirname(fromSodium.resolve('libsodium-sumo')), '../..')
  assert.equal(JSON.parse(fs.readFileSync(path.join(wrapper, 'package.json'))).version, '0.7.13')
  fs.mkdirSync(output, {recursive: true})
  for (const [name, source] of [['libsodium-wrappers-sumo', wrapper], ['libsodium-sumo', core]]) {
    fs.cpSync(source, path.join(output, 'reference/node_modules', name), {recursive: true, dereference: true})
  }
  for (const name of ['sodium-native.cjs', 'sodium-native.checks.cjs']) fs.copyFileSync(path.join(__dirname, '..', name), path.join(output, name))
  fs.cpSync(path.join(__dirname, '../test-vectors'), path.join(output, 'test-vectors'), {recursive: true})
  fs.copyFileSync(path.join(__dirname, 'probe.cjs'), path.join(output, 'probe.cjs'))
  const factory = (await import('../../webpack.config.js')).default
  const rule = factory({mode: 'production'}).module.rules.find(rule => String(rule.loader).endsWith('sodium-loader.cjs'))
  const webpack = require('webpack')
  const entry = path.join(output, 'entry.cjs')
  fs.writeFileSync(entry, `module.exports = require(${JSON.stringify(sodiumPath)});`)
  const compiler = webpack({mode: 'production', target: 'node', entry, module: {rules: [rule]}, output: {path: output, filename: 'bundled-sodium.cjs', library: {type: 'commonjs2'}}})
  const stats = await new Promise((resolve, reject) => compiler.run((error, stats) => error ? reject(error) : resolve(stats)))
  await new Promise(resolve => compiler.close(resolve))
  assert.equal(stats.hasErrors(), false, stats.toString({all: false, errors: true}))
  fs.unlinkSync(entry)
}
if (require.main === module) {
  const [output, sodiumPath] = process.argv.slice(2)
  if (!output || !sodiumPath) throw new Error('Usage: node prepare-payload.cjs NEW_DIRECTORY RESOLVED_SODIUM_WRAPPER_JS')
  prepare(path.resolve(output), path.resolve(sodiumPath)).catch(error => {console.error(error); process.exitCode = 1})
}
module.exports = {prepare}

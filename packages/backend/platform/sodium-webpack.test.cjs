'use strict'
const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const {createRequire} = require('node:module')
const {spawnSync} = require('node:child_process')

test('production webpack loader loads the real packaged addon before ready on iOS only', async () => {
  const webpack = require('webpack')
  const factory = (await import('../webpack.config.js')).default
  const rule = factory({mode: 'development'}).module.rules.find(rule => String(rule.loader).endsWith('sodium-loader.cjs'))
  assert.ok(rule)
  const fromLfa = createRequire(path.resolve(__dirname, '../../../3rd-party/auth/packages/crypto/package.json'))
  const sodiumPath = process.env.QUIET_NATIVE_TEST_SODIUM || fromLfa.resolve('libsodium-wrappers-sumo')
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'quiet-sodium-webpack-'))
  try {
    const project = path.join(directory, 'nodejs-project')
    fs.mkdirSync(project)
    const framework = path.join(directory, 'Frameworks/QuietSodium.framework')
    fs.mkdirSync(framework, {recursive: true})
    fs.copyFileSync(path.join(__dirname, 'native-libsodium/.build/host/quiet_sodium.node'), path.join(framework, 'QuietSodium'))
    const entry = path.join(directory, 'entry.cjs')
    fs.writeFileSync(entry, `module.exports = require(${JSON.stringify(sodiumPath)});`)
    const compiler = webpack({mode: 'production', target: 'node', entry, output: {path: project, filename: 'bundle.cjs', library: {type: 'commonjs2'}}, module: {rules: [rule]}})
    const stats = await new Promise((resolve, reject) => compiler.run((error, stats) => error ? reject(error) : resolve(stats)))
    await new Promise((resolve, reject) => compiler.close(error => error ? reject(error) : resolve()))
    assert.equal(stats.hasErrors(), false, stats.toString({all: false, errors: true}))
    const probe = `
      const assert = require('node:assert/strict');
      const platform = process.argv[1];
      Object.defineProperty(process, 'platform', {value: platform});
      let calls = 0, loaded = 0; const original = process.dlopen;
      process.dlopen = (module, filename) => {
        original(module, filename); loaded++;
        const binding = module.exports;
        module.exports = Object.fromEntries(Object.getOwnPropertyNames(binding).map(name => [name,
          typeof binding[name] === 'function' ? (...args) => {calls++; return binding[name](...args)} : binding[name]]));
      };
      const sodium = require(${JSON.stringify(path.join(project, 'bundle.cjs'))});
      sodium.ready.then(() => {
        calls = 0;
        const pair = sodium.crypto_sign_seed_keypair(new Uint8Array(32));
        const sig = sodium.crypto_sign_detached(new Uint8Array([1,2,3]), pair.privateKey);
        assert.equal(sodium.crypto_sign_verify_detached(sig, new Uint8Array([1,2,3]), pair.publicKey), true);
        assert.equal(calls, platform === 'ios' ? 3 : 0);
        assert.equal(loaded, platform === 'ios' ? 1 : 0);
      }).catch(error => {console.error(error); process.exitCode = 1});
    `
    for (const platform of ['ios', 'android', 'darwin', 'linux', 'win32']) {
      const result = spawnSync(process.execPath, ['-e', probe, platform], {encoding: 'utf8'})
      assert.equal(result.status, 0, `${platform}: ${result.stderr}`)
    }
  } finally {fs.rmSync(directory, {recursive: true, force: true})}
})

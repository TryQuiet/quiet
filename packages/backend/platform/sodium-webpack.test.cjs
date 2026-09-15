'use strict'
const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const {createRequire} = require('node:module')
const {spawnSync} = require('node:child_process')

test('production webpack rule initializes native sodium before consumers await ready, only on iOS', async () => {
  const webpack = require('webpack')
  const factory = (await import('../webpack.config.js')).default
  const rule = factory({mode: 'development'}).module.rules.find(rule => String(rule.loader).endsWith('sodium-loader.cjs'))
  assert.ok(rule, 'production build must include the sodium loader')
  const requireLfa = createRequire(path.resolve(__dirname, '../../..', '3rd-party/auth/packages/crypto/package.json'))
  const sodiumPath = requireLfa.resolve('libsodium-wrappers-sumo')
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'quiet-sodium-webpack-'))
  try {
    const entry = path.join(directory, 'entry.cjs')
    fs.writeFileSync(entry, `module.exports = require(${JSON.stringify(sodiumPath)});`)
    const config = {mode: 'development', target: 'node', entry, output: {path: directory, filename: 'bundle.cjs', library: {type: 'commonjs2'}}, module: {rules: [rule]}}
    const stats = await new Promise((resolve, reject) => webpack(config, (error, stats) => error ? reject(error) : resolve(stats)))
    assert.equal(stats.hasErrors(), false, stats.toString({all: false, errors: true}))
    const bundle = path.join(directory, 'bundle.cjs')
    const probe = `
      const assert = require('node:assert/strict');
      const crypto = require('node:crypto');
      const platform = process.argv[1];
      Object.defineProperty(process, 'platform', {value: platform});
      let calls = 0; const original = crypto.createPrivateKey;
      crypto.createPrivateKey = function(...args) { calls++; return original.apply(this,args) };
      const sodium = require(${JSON.stringify(bundle)});
      sodium.ready.then(() => {
        calls = 0;
        const keys = sodium.crypto_sign_seed_keypair(new Uint8Array(32));
        const sig = sodium.crypto_sign_detached('bundled', keys.privateKey);
        assert.equal(sodium.crypto_sign_verify_detached(sig, 'bundled', keys.publicKey), true);
        assert.equal(calls > 0, platform === 'ios');
        console.log(JSON.stringify({platform,native: calls > 0}));
      }).catch(error => { console.error(error); process.exitCode = 1 });
    `
    for (const platform of ['ios', 'android', 'darwin', 'linux', 'win32']) {
      const result = spawnSync(process.execPath, ['-e', probe, platform], {encoding: 'utf8'})
      assert.equal(result.status, 0, result.stderr)
      assert.deepEqual(JSON.parse(result.stdout), {platform, native: platform === 'ios'})
    }
  } finally { fs.rmSync(directory, {recursive: true, force: true}) }
})

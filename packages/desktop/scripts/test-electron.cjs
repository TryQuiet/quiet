// Run with a display (xvfb-run -a npm run test:electron on headless Linux).
const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { spawnSync } = require('node:child_process')
const { pathToFileURL } = require('node:url')

const desktop = path.resolve(__dirname, '..')
const backend = path.resolve(desktop, '../backend')
const electron = require('electron')
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'quiet-electron-test-'))

function run(args, extraEnv = {}) {
  const env = { ...process.env, ...extraEnv }
  delete env.NODE_OPTIONS
  const result = spawnSync(electron, args, { env, encoding: 'utf8', timeout: 60_000 })
  if (result.stdout) process.stdout.write(result.stdout)
  if (result.stderr) process.stderr.write(result.stderr)
  assert.ifError(result.error)
  assert.equal(result.status, 0, `Electron exited with ${result.status} (${result.signal})`)
}

async function main() {
  // Use the production webpack configuration, including Quiet's native binding
  // replacement, and the exact binaries shipped in backend-bundle.
  const { default: makeConfig } = await import(pathToFileURL(path.join(backend, 'webpack.config.js')))
  const config = makeConfig({ mode: 'production' })
  config.context = backend
  config.entry = {
    database: path.join(__dirname, 'fixtures/electron-database.cjs'),
    auth: path.join(__dirname, 'fixtures/electron-auth.cjs'),
  }
  config.output = { ...config.output, path: temporary }
  const webpack = require(path.join(backend, 'node_modules/webpack'))
  await new Promise((resolve, reject) => {
    const compiler = webpack(config)
    compiler.run((error, stats) => {
      compiler.close(closeError => {
        if (error || closeError) return reject(error || closeError)
        if (stats.hasErrors()) return reject(new Error(stats.toString({ all: false, errors: true })))
        resolve()
      })
    })
  })
  fs.cpSync(path.resolve(desktop, '../backend-bundle/deps'), path.join(temporary, 'deps'), { recursive: true })
  const database = path.join(temporary, 'database')
  for (const phase of ['write', 'read']) {
    run([path.join(temporary, 'database.cjs'), database, phase], { ELECTRON_RUN_AS_NODE: '1' })
  }
  run([path.join(temporary, 'auth.cjs')], { ELECTRON_RUN_AS_NODE: '1' })
  const flags = process.env.QUIET_ELECTRON_TEST_NO_SANDBOX === '1' ? ['--no-sandbox'] : []
  run([...flags, path.join(__dirname, 'fixtures/electron-window.cjs')], {
    ELECTRON_RUN_AS_NODE: '',
    QUIET_ELECTRON_TEST_DATA: temporary,
  })
}

main()
  .catch(error => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(() => fs.rmSync(temporary, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }))

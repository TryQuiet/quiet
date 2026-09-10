/* Runs the production helper registration and renderer bridge in real Electron.
 * Linux prerequisites: installed desktop dependencies and xvfb-run.
 * No browser or desktop association is changed: XDG tools and HOME are fixtures.
 */
const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { execFileSync } = require('node:child_process')
const ts = require('typescript')

assert.equal(process.platform, 'linux', 'AppImage helper integration requires Linux')
const desktop = path.resolve(__dirname, '..')
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'quiet-appimage-helpers-'))
const capture = path.join(temp, 'helpers.jsonl')
const helperDir = path.join(temp, 'bin')
const fixtureHome = path.join(temp, 'home')

try {
  fs.mkdirSync(helperDir)
  fs.mkdirSync(path.join(fixtureHome, '.local/share/applications'), { recursive: true })
  fs.writeFileSync(
    path.join(fixtureHome, '.local/share/applications/quiet.desktop'),
    '[Desktop Entry]\nExec=Quiet %U\n'
  )
  fs.symlinkSync(path.join(desktop, 'node_modules'), path.join(temp, 'node_modules'), 'dir')

  for (const file of [
    'main/appImageEnvironment.ts',
    'main/externalLinks.ts',
    'main/invitation.ts',
    'main/logger.ts',
    'shared/externalLinks.ts',
    'renderer/openExternal.ts',
  ]) {
    const output = path.join(temp, file.replace(/\.ts$/, '.js'))
    fs.mkdirSync(path.dirname(output), { recursive: true })
    fs.writeFileSync(
      output,
      ts.transpileModule(fs.readFileSync(path.join(desktop, 'src', file), 'utf8'), {
        compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS, esModuleInterop: true },
      }).outputText
    )
  }

  const recordHelper = path.join(temp, 'record-helper.cjs')
  fs.writeFileSync(
    recordHelper,
    `
    const fs = require('node:fs')
    fs.appendFileSync(${JSON.stringify(capture)}, JSON.stringify({
      args: process.argv.slice(2),
      preload: process.env.LD_PRELOAD,
      libraryPath: process.env.LD_LIBRARY_PATH,
      sentinel: process.env.QUIET_HOST_ENV_TEST,
    }) + '\\n')
  `
  )
  for (const name of ['xdg-open', 'xdg-mime', 'xdg-settings']) {
    // Fixture paths originate from mkdtemp, not user input.
    fs.writeFileSync(
      path.join(helperDir, name),
      `#!/bin/sh\nexec '${process.execPath}' '${recordHelper}' '${name}' "$@"\n`,
      { mode: 0o755 }
    )
  }

  const urls = [
    'https://tryquiet.org/#Downloads',
    'https://github.com/TryQuiet/quiet/wiki/Privacy-Policy',
    'https://example.com/chat?message=hello%20world&reply=1',
  ]
  const entry = path.join(temp, 'app.cjs')
  fs.writeFileSync(
    entry,
    `
    require('./main/appImageEnvironment')
    const assert = require('node:assert/strict')
    const fs = require('node:fs')
    const { app, BrowserWindow } = require('electron')
    const { registerExternalLinkHandler } = require('./main/externalLinks')
    const { updateDesktopFile } = require('./main/invitation')
    app.disableHardwareAcceleration()
    registerExternalLinkHandler()
    // Match production registration before app readiness.
    updateDesktopFile(false)
    app.whenReady().then(async () => {
      const window = new BrowserWindow({ show: false, webPreferences: {
        nodeIntegration: true, contextIsolation: false, sandbox: false,
      } })
      await window.loadURL('data:text/html,<html><body>Quiet helper test</body></html>')
      await window.webContents.executeJavaScript(${JSON.stringify(`
        (async () => {
          // Simulate a renderer inherited from an already-started, contaminated zygote.
          process.env.LD_PRELOAD = 'renderer-preload-must-not-reach-host'
          process.env.LD_LIBRARY_PATH = '/renderer-libraries-must-not-reach-host'
          const { openExternal } = require(${JSON.stringify(path.join(temp, 'renderer/openExternal.js'))})
          for (const url of ${JSON.stringify(urls)}) await openExternal(url)
        })()
      `)})
      const deadline = Date.now() + 10000
      let records = []
      while (Date.now() < deadline) {
        records = fs.existsSync(${JSON.stringify(capture)})
          ? fs.readFileSync(${JSON.stringify(capture)}, 'utf8').trim().split('\\n').filter(Boolean).map(JSON.parse)
          : []
        if (records.length >= 6) break
        await new Promise(resolve => setTimeout(resolve, 50))
      }
      assert.equal(records.filter(record => record.args[0] === 'xdg-mime').length, 2)
      assert.equal(records.filter(record => record.args[0] === 'xdg-settings').length, 1)
      const opened = records.filter(record => record.args[0] === 'xdg-open').map(record => record.args[1])
      assert.deepEqual(opened.sort(), ${JSON.stringify(urls)}.sort())
      for (const record of records) {
        assert.equal(record.preload, undefined, JSON.stringify(record))
        assert.equal(record.libraryPath, undefined, JSON.stringify(record))
        assert.equal(record.sentinel, 'preserved')
      }
      assert.ok(fs.readFileSync(${JSON.stringify(path.join(fixtureHome, '.local/share/applications/quiet.desktop'))}, 'utf8').includes('Exec=/test/Quiet.AppImage %U'))
      console.log('PASS: startup XDG registration and renderer links launch clean host helpers')
      window.destroy()
      app.exit(0)
    }).catch(error => { console.error(error); app.exit(1) })
  `
  )
  const env = {
    ...process.env,
    HOME: fixtureHome,
    XDG_CONFIG_HOME: path.join(fixtureHome, '.config'),
    XDG_CACHE_HOME: path.join(fixtureHome, '.cache'),
    PATH: `${helperDir}:${process.env.PATH}`,
    APPIMAGE: '/test/Quiet.AppImage',
    LD_PRELOAD: '',
    LD_LIBRARY_PATH: '/appimage-libraries-must-not-reach-host',
    QUIET_HOST_ENV_TEST: 'preserved',
    LOG_TO_FILE: 'false',
  }
  delete env.ELECTRON_RUN_AS_NODE
  const output = execFileSync('xvfb-run', ['-a', require('electron'), '--no-sandbox', entry], {
    env,
    encoding: 'utf8',
    timeout: 30000,
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  assert.match(output, /PASS: startup XDG registration and renderer links launch clean host helpers/)
  console.log('PASS: startup XDG registration and renderer links launch clean host helpers')
} catch (error) {
  if (error.stdout) process.stderr.write(error.stdout)
  if (error.stderr) process.stderr.write(error.stderr)
  throw error
} finally {
  fs.rmSync(temp, { recursive: true, force: true })
}

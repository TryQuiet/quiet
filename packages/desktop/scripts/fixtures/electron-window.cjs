const assert = require('node:assert/strict')
const path = require('node:path')
const { setTimeout: delay } = require('node:timers/promises')
const { app, BrowserWindow, Menu, clipboard, dialog } = require('electron')
const remote = require('@electron/remote/main')
const ElectronStore = require('electron-store')
const { setupContextMenu } = require('../../dist/main/contextMenu')

app.setPath('userData', path.join(process.env.QUIET_ELECTRON_TEST_DATA, 'user-data'))
remote.initialize()
ElectronStore.initRenderer()

async function main() {
  await app.whenReady()
  assert.equal(process.versions.electron, require('../../package.json').devDependencies.electron)
  const dispose = setupContextMenu()
  const window = new BrowserWindow({ webPreferences: { nodeIntegration: true, contextIsolation: false } })
  remote.enable(window.webContents)
  const errors = []
  dialog.showErrorBox = (title, message) => errors.push(`${title}: ${message}`)
  let menu
  const originalPopup = Menu.prototype.popup
  Menu.prototype.popup = function () {
    menu = this
  }
  try {
    const file = path.join(process.env.QUIET_ELECTRON_TEST_DATA, 'window.html')
    require('node:fs').writeFileSync(
      file,
      '<title>Quiet Electron smoke</title><a id="link" href="https://tryquiet.org/invite?code=clipboard-test">Copy this invitation</a><input id="message">'
    )
    await window.loadFile(file)
    window.focus()
    assert.deepEqual(
      await window.webContents.executeJavaScript(`(() => {
      const remote = require(${JSON.stringify(require.resolve('@electron/remote'))})
      const Store = require(${JSON.stringify(require.resolve('electron-store'))})
      const store = new Store({ name: 'electron-upgrade-test' })
      store.set('draft', 'unsent message')
      return { title: remote.getCurrentWindow().getTitle(), draft: store.get('draft') }
    })()`),
      { title: 'Quiet Electron smoke', draft: 'unsent message' }
    )

    const position = await window.webContents.executeJavaScript(`(() => {
      const bounds = document.getElementById('link').getBoundingClientRect()
      return { x: Math.ceil(bounds.x + 5), y: Math.ceil(bounds.y + 5) }
    })()`)
    window.webContents.sendInputEvent({ type: 'mouseDown', button: 'right', clickCount: 1, ...position })
    window.webContents.sendInputEvent({ type: 'mouseUp', button: 'right', clickCount: 1, ...position })
    for (let i = 0; !menu && i < 100; i++) await delay(20)
    assert.ok(menu, 'right-click should open the production context menu')
    assert.equal(menu.getMenuItemById('inspect'), null)
    const copyLink = menu.getMenuItemById('copyLink')
    assert.ok(copyLink, 'link menu should offer Copy Link')
    const link = 'https://tryquiet.org/invite?code=clipboard-test'
    await clipboard.writeText('clipboard before Copy Link')
    copyLink.click({}, window, window.webContents)
    // MenuItem.click discards the asynchronous handler's return value. Observe
    // the real clipboard write finishing, including on macOS's pasteboard.
    for (let i = 0; i < 250; i++) {
      if ((await clipboard.readText()) === link || errors.length > 0) break
      await delay(20)
    }
    assert.deepEqual(errors, [], 'clipboard actions must not open an error dialog')
    assert.equal(await clipboard.readText(), link)
    await window.webContents.executeJavaScript("document.getElementById('message').focus()")
    window.webContents.paste()
    for (let i = 0; i < 100; i++) {
      if ((await window.webContents.executeJavaScript("document.getElementById('message').value")) === link) break
      await delay(20)
    }
    assert.equal(await window.webContents.executeJavaScript("document.getElementById('message').value"), link)
    console.log(
      'PASS Electron window: renderer store/remote, native context menu Copy Link, system clipboard and paste'
    )
  } finally {
    Menu.prototype.popup = originalPopup
    dispose()
    window.destroy()
  }
}

main().then(
  () => app.exit(0),
  error => {
    console.error(error)
    app.exit(1)
  }
)

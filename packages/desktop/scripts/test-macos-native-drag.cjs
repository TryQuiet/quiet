// Attach to a real packaged Quiet with a disposable, empty DATA_DIR and
// --remote-debugging-port=9231. Requires Node 24, Python 3, an unlocked Mac
// desktop, and Accessibility permission. CDP only reads DOM/window state and
// focuses/restores the window; all test input goes through macOS WindowServer.
const assert = require('node:assert/strict')
const path = require('node:path')
const { spawnSync } = require('node:child_process')
const { setTimeout: delay } = require('node:timers/promises')

async function main() {
  assert.equal(process.platform, 'darwin', 'This regression must run against macOS native hit testing')
  const port = process.env.QUIET_DEBUG_PORT || '9231'
  const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()
  const target = targets.find(target => target.title === 'Quiet')
  assert.ok(target, 'Launch packaged Quiet on the debug port with an empty disposable DATA_DIR')
  const socket = new WebSocket(target.webSocketDebuggerUrl)
  await new Promise((resolve, reject) => {
    socket.onopen = resolve
    socket.onerror = reject
  })
  let serial = 0
  const evaluate = expression => new Promise((resolve, reject) => {
    const id = ++serial
    const timeout = setTimeout(() => reject(new Error('CDP response timed out')), 10000)
    const listener = event => {
      const response = JSON.parse(event.data)
      if (response.id !== id) return
      clearTimeout(timeout)
      socket.removeEventListener('message', listener)
      if (response.error || response.result.exceptionDetails) reject(new Error(JSON.stringify(response)))
      else resolve(response.result.result.value)
    }
    socket.addEventListener('message', listener)
    socket.send(JSON.stringify({ id, method: 'Runtime.evaluate', params: { expression, returnByValue: true } }))
  })
  const state = () => evaluate(`(() => {
    const w = require('@electron/remote').getCurrentWindow();
    return { bounds: w.getBounds(), content: w.getContentBounds(), focused: w.isFocused() };
  })()`)
  const nativeMouse = async (mode, point) => {
    const result = spawnSync(process.env.PYTHON || 'python3', [
      path.join(__dirname, 'macos-native-mouse.py'), mode, String(point.x), String(point.y),
    ], { encoding: 'utf8', timeout: 10000 })
    assert.ifError(result.error)
    assert.equal(result.status, 0, result.stderr)
    await delay(400)
  }
  const elementPoint = async selector => {
    const rect = await evaluate(`(() => {
      const e = document.querySelector(${JSON.stringify(selector)});
      if (!e) return null;
      const r = e.getBoundingClientRect();
      return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
    })()`)
    assert.ok(rect, `Missing onboarding control ${selector}; use an empty disposable profile`)
    const { content } = await state()
    return { x: content.x + rect.x, y: content.y + rect.y }
  }
  const original = await evaluate(`(() => {
    const r = require('@electron/remote'), w = r.getCurrentWindow();
    const original = { bounds: w.getBounds(), alwaysOnTop: w.isAlwaysOnTop() };
    r.app.focus({ steal: true }); w.show(); w.setAlwaysOnTop(true); w.focus();
    return original;
  })()`)
  try {
    await delay(500)
    // Positive control: proves events reached native drag hit testing, rather
    // than passing because event injection is blocked or the screen is locked.
    const beforeTitle = await state()
    await nativeMouse('drag', { x: beforeTitle.content.x + 400, y: beforeTitle.content.y + 12 })
    const afterTitle = await state()
    assert.ok(Math.abs(afterTitle.bounds.x - beforeTitle.bounds.x) >= 30,
      'Native title-bar drag must move the window (input delivery positive control)')
    console.log('PASS native title-bar drag moves the packaged window')

    const beforeContent = await state()
    await nativeMouse('drag', { x: beforeContent.content.x + 700, y: beforeContent.content.y + 420 })
    assert.deepEqual((await state()).bounds, beforeContent.bounds,
      'Dragging onboarding content must not move the window')
    console.log('PASS onboarding content does not drag the window')

    await nativeMouse('click', await elementPoint('[data-testid="JoinCommunityLink"]'))
    assert.equal(await evaluate('document.querySelector("h3")?.textContent'), 'Create your community',
      'Native Create community click must open the creation form')
    await nativeMouse('click', await elementPoint('[data-testid="continue-createCommunity"]'))
    assert.equal(await evaluate('document.querySelector("input[name=name]")?.getAttribute("aria-invalid")'), 'true',
      'Native Continue click must submit the empty form and display validation')
    console.log('PASS native Create community and Continue clicks reach the real onboarding form')
    await nativeMouse('click', await elementPoint('[data-testid="CreateCommunityLink"]'))
    assert.equal(await evaluate('document.querySelector("h3")?.textContent'), 'Join community')
  } finally {
    await evaluate(`(() => { const w = require('@electron/remote').getCurrentWindow();
      w.setBounds(${JSON.stringify(original.bounds)}); w.setAlwaysOnTop(${original.alwaysOnTop}); })()`)
    socket.close()
  }
}

main().catch(error => { console.error(error); process.exitCode = 1 })

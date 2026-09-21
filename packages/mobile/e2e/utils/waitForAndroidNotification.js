const assert = require('node:assert/strict')
const { execFile } = require('node:child_process')
const { randomUUID } = require('node:crypto')
const path = require('node:path')
const { promisify } = require('node:util')

const execFileAsync = promisify(execFile)

module.exports = async function waitForAndroidNotification(device) {
  if (device.getPlatform() !== 'android') return

  // SystemUI's heads-up row is outside Detox's app hierarchy. These pinned
  // Detox APIs identify the running app and expose its UIAutomator connection.
  const appId = device._bundleId
  assert.match(appId, /^[a-zA-Z0-9_.]+$/, 'Detox must identify the running Android package')
  const ui = device.getUiDevice()
  const adb = path.join(process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT, 'platform-tools', 'adb')
  const hierarchy = `/data/user/0/${appId}/cache/quiet-heads-up-${randomUUID()}.xml`
  const shell = (...args) =>
    execFileAsync(adb, ['-s', device.id, 'shell', 'run-as', appId, ...args], { timeout: 15000 })
  const deadline = Date.now() + 15000

  try {
    do {
      await ui.dumpWindowHierarchy(hierarchy)
      const { stdout } = await shell('cat', hierarchy)
      assert(
        stdout.includes('<hierarchy ') && stdout.trimEnd().endsWith('</hierarchy>'),
        'Expected a complete UI hierarchy'
      )
      if (!stdout.includes('resource-id="com.android.systemui:id/expandableNotificationRow"')) return
      await new Promise(resolve => setTimeout(resolve, 250))
    } while (Date.now() < deadline)
    throw new Error('Android heads-up notification still covers the header after 15 seconds')
  } finally {
    await shell('rm', '-f', hierarchy)
  }
}

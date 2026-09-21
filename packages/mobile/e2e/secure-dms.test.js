import fs from 'fs'
import assert from 'assert'
import path from 'path'
import { execFileSync } from 'child_process'

// Launched by the desktop cross-platform suite after it creates the real community.
const scenarioPath = process.env.QUIET_DM_SCENARIO
const suite = scenarioPath ? describe : describe.skip
suite('Authenticated desktop/mobile DM', () => {
  let scenario
  const marker = name => path.join(path.dirname(scenarioPath), name)
  const signal = name => fs.writeFileSync(marker(name), 'ready', { mode: 0o600 })
  const waitForMarker = async name => {
    const deadline = Date.now() + 480_000
    while (!fs.existsSync(marker(name))) {
      if (Date.now() > deadline) throw new Error(`Desktop did not reach ${name}`)
      await new Promise(resolve => setTimeout(resolve, 250))
    }
  }
  const visible = async (matcher, timeout = 180_000) => await waitFor(element(matcher)).toBeVisible().withTimeout(timeout)
  const compose = () => element(by.id('input').withAncestor(by.id('message-composer')))
  const send = async text => {
    await compose().tap()
    await compose().typeText(text)
    await element(by.id('send_message_button')).tap()
    await visible(by.id(text))
  }

  beforeAll(async () => {
    scenario = JSON.parse(fs.readFileSync(scenarioPath, 'utf8'))
    const server = new URL(process.env.QSS_ENDPOINT)
    if (['localhost', '127.0.0.1'].includes(server.hostname)) await device.reverseTcpPort(Number(server.port))
    await device.launchApp({ delete: true, newInstance: true, launchArgs: { detoxURLBlacklistRegex: '.*' } })
    // Ignore long-lived Tor/QSS sockets while retaining UI/keyboard synchronization.
  })
  afterAll(async () => { await device.terminateApp() })

  it('joins through a real invitation, receives authenticated text and a file, and sends after a restart', async () => {
    await visible(by.text('Join community'))
    await element(by.id('input')).typeText(scenario.invitation)
    await device.pressBack()
    await element(by.text('Continue')).tap()
    await visible(by.text('Register a username'))
    await element(by.id('input')).typeText(scenario.mobileUser)
    await device.pressBack()
    await element(by.text('Continue')).tap()
    await visible(by.text('Agree & Continue'))
    await element(by.text('Agree & Continue')).tap()
    await visible(by.id('messages-home-container'))
    signal('mobile-joined')

    await visible(by.text(scenario.desktopUser).withAncestor(by.id('dm-list')))
    await element(by.text(scenario.desktopUser).withAncestor(by.id('dm-list'))).tap()
    await visible(by.id(scenario.firstMessage))
    await visible(by.text(scenario.filename))
    // Fresh onion services can need several minutes to become reachable over Tor.
    await visible(by.text('Downloaded'), 480_000)
    console.info('Android completed the authenticated attachment download')

    // Compare the actual authenticated output, beyond merely observing a download label.
    const adb = process.env.ADB_PATH || 'adb'
    const args = ['-s', process.env.QUIET_DM_ANDROID_DEVICE, 'shell', 'run-as', 'com.quietmobile.debug']
    const listing = execFileSync(adb, [...args, 'find', 'files', '-type', 'f', '-name', '*.txt'], { encoding: 'utf8' })
    const downloads = listing.trim().split('\n').filter(file => file.includes('/downloads/'))
    assert(
      downloads.some(file => execFileSync(adb, [...args, 'cat', file], { encoding: 'utf8' }) === scenario.fileContents),
      'Downloaded DM attachment must match the original plaintext byte for byte'
    )
    await send(scenario.mobileReply)
    signal('mobile-received')
    console.info('Android verified the file contents and sent its reply')
    await waitForMarker('desktop-offline')

    // Restored background workers can load Node before the React Native frontend.
    // Exercise that native-library load order repeatedly with persisted DM state.
    for (let restart = 0; restart < 3; restart += 1) {
      await device.terminateApp()
      await device.launchApp({ newInstance: true, launchArgs: { detoxURLBlacklistRegex: '.*' } })
      await visible(by.id('messages-home-container'))
      await visible(by.text(scenario.desktopUser).withAncestor(by.id('dm-list')))
      await element(by.text(scenario.desktopUser).withAncestor(by.id('dm-list'))).tap()
      await visible(by.id(scenario.firstMessage))
      await visible(by.text('Downloaded'))
      console.info(`Android restored DM text and attachment after restart ${restart + 1}`)
    }
    await send(scenario.offlineReply)
    signal('mobile-finished')
    console.info('Android restored DM history and sent while desktop was offline')
  }, 1_200_000)
})

import crypto from 'crypto'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { DESKTOP_DATA_DIR } from '@quiet/common'
import {
  App,
  Channel,
  CreateCommunityModal,
  JoinCommunityModal,
  JoiningLoadingPanel,
  RegisterUsernameModal,
  Sidebar,
} from '../selectors'
import { downloadInstaller } from '../utils'
import { createLogger } from '../logger'

const logger = createLogger('backwardsCompatibility')
const describeLinux = process.platform === 'linux' ? describe : describe.skip

// Release 8 changed authentication/storage; releases 8 and 9 deliberately changed
// their default data directories. Do not bypass that contract with DATA_DIR.
// Keep a published binary using the current directory as well as the old boundary.
const releases = [
  {
    version: '7.0.1',
    directoryName: 'Quiet7',
    channelTypeIcons: false,
    chromeDriverPath: require.resolve('electron-chromedriver-126/chromedriver.js'),
  },
  {
    version: '9.0.2',
    directoryName: 'Quiet9',
    channelTypeIcons: true,
    chromeDriverPath: require.resolve('electron-chromedriver/chromedriver.js'),
  },
]

type SavedMessage = { messageId: string; text: string }
type SavedChannels = Map<string, SavedMessage[]>
const username = 'bob'

// Compare contents, not modification times: opening the new release must not
// rewrite or remove any part of the deliberately separate old profile.
function snapshotProfile(directory: string): Record<string, string> {
  const entries: Record<string, string> = {}
  function visit(relative: string) {
    const file = path.join(directory, relative)
    const stat = fs.lstatSync(file)
    if (stat.isSymbolicLink()) entries[relative] = `link:${fs.readlinkSync(file)}`
    else if (stat.isDirectory()) {
      entries[relative] = 'directory'
      for (const child of fs.readdirSync(file).sort()) visit(path.join(relative, child))
    } else entries[relative] = crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')
  }
  visit('')
  return entries
}

async function expectReleasePaths(app: App, root: string, directoryName: string) {
  const appData = path.join(root, directoryName)
  const userData = path.join(appData, 'Quiet')
  const actual = await app.driver.executeScript(
    `const remote = require('@electron/remote');
     return { appData: remote.app.getPath('appData'), userData: remote.app.getPath('userData'),
       dataDirOverride: remote.process.env.DATA_DIR || null };`
  )
  expect(actual).toEqual({ appData, userData, dataDirOverride: null })

  // Verify the real backend command's -a argument as well as Electron's paths.
  // Read only this test's processes; do not match or terminate global Quiet apps.
  const backendPaths = fs.readdirSync('/proc').flatMap(pid => {
    if (!/^\d+$/.test(pid)) return []
    try {
      const args = fs.readFileSync(`/proc/${pid}/cmdline`, 'utf8').split('\0')
      if (!args.some(arg => arg.endsWith('/backend-bundle/bundle.cjs'))) return []
      const backendRoot = args[args.indexOf('-a') + 1]
      return backendRoot?.startsWith(`${root}${path.sep}`) ? [backendRoot] : []
    } catch {
      return [] // A different process may exit while /proc is being inspected.
    }
  })
  expect(backendPaths).toEqual([appData])
  expect(fs.existsSync(path.join(userData, 'backendDB'))).toBe(true)
  logger.info('Verified release paths', { directoryName, appData, userData, backendPaths })
}

async function createCommunity(app: App, name: string) {
  const join = new JoinCommunityModal(app.driver)
  expect(await join.isReady()).toBe(true)
  await join.switchToCreateCommunity()
  const create = new CreateCommunityModal(app.driver)
  expect(await create.isReady()).toBe(true)
  await create.typeCommunityName(name)
  await create.submit()
  const register = new RegisterUsernameModal(app.driver)
  expect(await register.isReady()).toBe(true)
  await register.typeUsername(username)
  await register.submit()
  await new JoiningLoadingPanel(app.driver).waitForJoinToComplete()
  expect(await new Channel(app.driver, 'general').isMessageInputReady()).toBe(true)
}

async function expectVersion(app: App, version: string) {
  const settings = await new Sidebar(app.driver).openSettings()
  expect(await settings.getVersion()).toBe(version)
  await settings.closeTabThenModal()
}

async function sendMessage(channel: Channel, text: string): Promise<SavedMessage> {
  expect(await channel.isMessageInputReady()).toBe(true)
  const { messageId } = await channel.sendMessage(text, username)
  const content = await channel.waitForMessageContentById(messageId)
  expect(await content.getText()).toBe(text)
  // Text appears optimistically before SEND_MESSAGE reaches the backend. The
  // pending style clears only when the stored message returns from the backend.
  await content
    .getDriver()
    .wait(
      async () => !(await content.getAttribute('class')).split(' ').includes('TextMessagepending'),
      30_000,
      `Message ${messageId} is still pending backend storage`,
      100
    )
  return { messageId, text }
}

async function expectChannels(app: App, channels: SavedChannels, channelTypeIcons: boolean) {
  const sidebar = new Sidebar(app.driver)
  expect((await sidebar.getChannelList()).length).toBe(channels.size)
  for (const [name, messages] of channels) {
    const channel = await sidebar.switchChannel(name, true, channelTypeIcons)
    expect(await channel.isOpen(true, channelTypeIcons)).toBe(true)
    expect(await channel.isMessageInputReady()).toBe(true)
    for (const { messageId, text } of messages) {
      expect(await (await channel.waitForMessageContentById(messageId)).getText()).toBe(text)
    }
  }
}

jest.setTimeout(600_000)
describeLinux('Release profile compatibility', () => {
  it.each(releases)('$version preserves compatible data or keeps a separate old profile usable', async release => {
    // The baseline must be a downloaded release even if its version equals the
    // current build; never reuse Quiet-<current>.AppImage for both sides.
    const fileName = downloadInstaller(release.version, `Quiet-${release.version}-release.AppImage`)
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'quiet-release-compat-'))
    const oldApp = new App({
      fileName,
      chromeDriverPath: release.chromeDriverPath,
      releaseProfile: { appDataRoot: root, directoryName: release.directoryName },
    })
    const currentApp = new App({ releaseProfile: { appDataRoot: root, directoryName: DESKTOP_DATA_DIR } })
    const separateProfiles = release.directoryName !== DESKTOP_DATA_DIR
    const oldChannels: SavedChannels = new Map()
    const currentChannels: SavedChannels = separateProfiles ? new Map() : oldChannels

    try {
      logger.info(`Creating real ${release.version} profile (${release.directoryName})`)
      await oldApp.open()
      await createCommunity(oldApp, 'legacycommunity')
      await expectReleasePaths(oldApp, root, release.directoryName)
      await expectVersion(oldApp, release.version)
      oldChannels.set('general', [await sendMessage(new Channel(oldApp.driver, 'general'), 'Before upgrade')])
      const sidebar = new Sidebar(oldApp.driver)
      // Both published fixtures expose public creation without a privacy toggle:
      // 7 predates it; 9.0.2 keeps it behind a production feature flag.
      await sidebar.addNewChannel('mid-night-club', true, false)
      const second = await sidebar.switchChannel('mid-night-club', true, release.channelTypeIcons)
      oldChannels.set('mid-night-club', [
        await sendMessage(second, 'Second channel history'),
        await sendMessage(second, 'ąbc'),
      ])
      await oldApp.close({ forceSaveState: true })
      const oldProfile = snapshotProfile(path.join(root, release.directoryName))

      logger.info(`Opening current build: ${separateProfiles ? 'separate release profile' : 'compatible profile'}`)
      await currentApp.open()
      if (separateProfiles) {
        // A breaking upgrade starts the normal setup UI, without deleting or
        // presenting unusable channels from the previous major release.
        await createCommunity(currentApp, 'currentcommunity')
        currentChannels.set('general', [])
      }
      await expectReleasePaths(currentApp, root, DESKTOP_DATA_DIR)
      await expectVersion(currentApp, currentApp.buildSetup.getVersionFromEnv())
      await expectChannels(currentApp, currentChannels, true)
      const currentGeneral = await new Sidebar(currentApp.driver).switchChannel('general')
      currentChannels.get('general')!.push(await sendMessage(currentGeneral, 'Sent by current release'))
      await currentApp.close({ forceSaveState: true })
      if (separateProfiles) expect(snapshotProfile(path.join(root, release.directoryName))).toEqual(oldProfile)

      logger.info('Reopening current profile and verifying persisted messages and writable channels')
      await currentApp.open()
      await expectReleasePaths(currentApp, root, DESKTOP_DATA_DIR)
      await expectChannels(currentApp, currentChannels, true)
      await currentApp.close({ forceSaveState: true })

      if (separateProfiles) {
        expect(snapshotProfile(path.join(root, release.directoryName))).toEqual(oldProfile)
        logger.info(`Reopening untouched ${release.version} profile`)
        await oldApp.open()
        await expectReleasePaths(oldApp, root, release.directoryName)
        await expectChannels(oldApp, oldChannels, release.channelTypeIcons)
        await sendMessage(new Channel(oldApp.driver, 'mid-night-club'), 'Old release still works')
        await oldApp.close({ forceSaveState: true })
      }
    } finally {
      // Accessing App.driver before open() creates a Selenium session. Only close
      // apps that started, so an earlier setup failure remains the real failure.
      if (currentApp.isOpened) await currentApp.close()
      if (oldApp.isOpened) await oldApp.close()
      fs.rmdirSync(root, { recursive: true })
    }
  })
})

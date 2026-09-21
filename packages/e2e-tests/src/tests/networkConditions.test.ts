import { execFileSync } from 'child_process'
import path from 'path'
import fs from 'fs'
import os from 'os'
import crypto from 'crypto'
import { By, until } from 'selenium-webdriver'
import {
  App,
  Channel,
  CreateCommunityModal,
  JoinCommunityModal,
  JoiningLoadingPanel,
  RegisterUsernameModal,
  Sidebar,
  ServerOfferModal,
  TermsOfServiceModal,
} from '../selectors'
import { SettingsModalTabName, FileAttachmentType } from '../enums'
import { type NetworkNamespace } from '../networkNamespace'

const enabled = process.env.QUIET_NETWORK_PLAYERS !== undefined
const qssEnabled = process.env.QUIET_NETWORK_QSS === 'true'
const suite = enabled ? describe : describe.skip
const script = path.resolve(__dirname, '../../scripts/network/run.py')
const deadline = qssEnabled ? 90_000 : 300_000

function shape(player: number, profile: 'fast' | 'slow') {
  execFileSync('python3', [script, '--profile', profile, '--player', String(player)], { stdio: 'inherit' })
}

// This suite deliberately never retries a scenario: a recovered retry can hide the race.
suite(`Two players: ${qssEnabled ? 'QSS with Tor unavailable' : 'Tor'}, asymmetric connections`, () => {
  let apps: App[] = []
  let scenarioPassed = false
  let uploadDirectory: string | undefined
  afterEach(async () => {
    const errors: unknown[] = []
    for (const app of apps) {
      try {
        if (app.isOpened && !scenarioPassed) {
          const artifacts = path.resolve('network-artifacts')
          fs.mkdirSync(artifacts, { recursive: true })
          fs.writeFileSync(path.join(artifacts, `${app.name}.png`), await app.driver.takeScreenshot(), 'base64')
        }
      } catch (error) {
        console.error('Could not capture network test screenshot', error)
      }
      try {
        await app.close()
      } catch (error) {
        errors.push(error)
      }
      try {
        await app.cleanup()
      } catch (error) {
        errors.push(error)
      }
    }
    apps = []
    if (uploadDirectory) fs.rmdirSync(uploadDirectory, { recursive: true })
    uploadDirectory = undefined
    shape(0, 'fast')
    shape(1, 'fast')
    if (errors.length) throw errors[0]
  }, 90_000)

  it.each([0, 1])(
    'joins, syncs history, and recovers when player %i has slow internet',
    async slowPlayer => {
      scenarioPassed = false
      expect(process.platform).toBe('linux')
      expect(process.env.LOCAL_TRANSPORT).toBe('false')
      const networks: NetworkNamespace[] = JSON.parse(process.env.QUIET_NETWORK_PLAYERS!)
      // Both clients use the same endpoint because it is also embedded in the invitation.
      // The owner's data gateway is reachable via data0 from either namespace.
      const qssEndpoint = `ws://${networks[0].gateway}:3003`
      shape(slowPlayer, 'slow') // Includes cold Tor bootstrap and onion-service publication.
      apps = networks.map(
        (networkNamespace, index) =>
          new App({
            username: index === 0 ? 'owner' : 'guest',
            networkNamespace,
            environment: { LOCAL_TRANSPORT: 'false', ...(qssEnabled ? { QSS_ENDPOINT: qssEndpoint } : {}) },
          })
      )
      const [owner, guest] = apps
      await owner.open(qssEnabled)
      if (qssEnabled) await owner.buildSetup.waitForProcessOutput('Spawned tor with pid(s):', 15_000)
      const join = new JoinCommunityModal(owner.driver)
      expect(await join.isReady()).toBeTruthy()
      await join.switchToCreateCommunity()
      const create = new CreateCommunityModal(owner.driver)
      expect(await create.isReady()).toBeTruthy()
      await create.typeCommunityName(`network${Date.now()}`)
      await create.submit()
      if (qssEnabled) await new ServerOfferModal(owner.driver).chooseUseServer()
      const register = new RegisterUsernameModal(owner.driver)
      await owner.driver.wait(until.elementLocated(By.xpath("//h3[text()='Register a username']")), deadline)
      expect(await register.isReady()).toBeTruthy()
      await register.typeUsername('owner')
      await register.submit()
      if (qssEnabled) await new TermsOfServiceModal(owner.driver).chooseAgreeAndJoin()
      if (!qssEnabled) await owner.buildSetup.waitForProcessOutput('Bootstrapping finished!', deadline)
      await new JoiningLoadingPanel(owner.driver).waitForJoinToComplete(15_000, deadline)
      const ownerChannel = new Channel(owner.driver, 'general')
      expect(await ownerChannel.isReady()).toBeTruthy()
      const history = Array.from({ length: 8 }, (_, i) => `history-${i}-${'synchronization '.repeat(40).trim()}`)
      for (const message of history) await ownerChannel.sendMessage(message, 'owner')
      const settings = await new Sidebar(owner.driver).openSettings()
      expect(await settings.isReady()).toBeTruthy()
      await settings.switchTab(SettingsModalTabName.INVITE)
      const invitation = await (await settings.invitationLink()).getText()
      await settings.closeTabThenModal()

      await guest.open(qssEnabled)
      if (qssEnabled) await guest.buildSetup.waitForProcessOutput('Spawned tor with pid(s):', 15_000)
      const guestJoin = new JoinCommunityModal(guest.driver)
      expect(await guestJoin.isReady()).toBeTruthy()
      await guestJoin.typeCommunityInviteLink(invitation)
      await guestJoin.submit()
      const guestRegister = new RegisterUsernameModal(guest.driver)
      await guest.driver.wait(until.elementLocated(By.xpath("//h3[text()='Register a username']")), deadline)
      expect(await guestRegister.isReady()).toBeTruthy()
      await guestRegister.typeUsername('guest')
      await guestRegister.submit()
      if (qssEnabled) await new TermsOfServiceModal(guest.driver).chooseAgreeAndJoin()
      if (!qssEnabled) await guest.buildSetup.waitForProcessOutput('Bootstrapping finished!', deadline)
      await new JoiningLoadingPanel(guest.driver).waitForJoinToComplete(15_000, deadline)
      // Resetting admission also hides the panel; it must not count as a successful join.
      expect(guest.buildSetup.hasProcessOutput('Emitting event: resetAdmission')).toBe(false)
      const guestChannel = new Channel(guest.driver, 'general')
      expect(await guestChannel.isReady()).toBeTruthy()
      for (const message of history) await guestChannel.waitForUserMessageByText('owner', message, deadline)
      await guestChannel.sendMessage('slow connection reply', 'guest')
      await ownerChannel.waitForUserMessageByText('guest', 'slow connection reply', deadline)

      // Attachments use peer transfer and belong to the Tor suite, not the QSS result.
      if (!qssEnabled) {
        uploadDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'quiet-network-upload-'))
        const payload = crypto.randomBytes(256 * 1024)
        const filename = 'network-integrity.bin'
        const upload = path.join(uploadDirectory, filename)
        fs.writeFileSync(upload, payload)
        await ownerChannel.attachFile(filename, upload, FileAttachmentType.FILE, 'owner')
        const downloads = path.join(guest.buildSetup.dataDirPath, 'Quiet', 'downloads')
        await guest.driver.wait(
          () => {
            if (!fs.existsSync(downloads)) return false
            return fs.readdirSync(downloads).some(file => {
              const downloaded = path.join(downloads, file)
              return fs.statSync(downloaded).isFile() && fs.readFileSync(downloaded).equals(payload)
            })
          },
          deadline,
          'Guest did not receive the exact attachment bytes over the slow connection'
        )
      }

      // Change an established connection in both directions, without restarting either client.
      shape(slowPlayer, 'fast')
      const otherPlayer = 1 - slowPlayer
      shape(otherPlayer, 'slow')
      await ownerChannel.sendMessage('message during slowdown', 'owner')
      await guestChannel.waitForUserMessageByText('owner', 'message during slowdown', deadline)
      shape(otherPlayer, 'fast')
      await guestChannel.sendMessage('message after recovery', 'guest')
      await ownerChannel.waitForUserMessageByText('guest', 'message after recovery', deadline)
      for (const app of apps) {
        if (qssEnabled) {
          // The app still starts Tor; QSS must succeed without Tor ever becoming ready.
          expect(app.buildSetup.hasProcessOutput('Bootstrapping finished!')).toBe(false)
        }
        expect(app.buildSetup.hasProcessOutput('Admission acquisition deadline expired')).toBe(false)
        expect(app.buildSetup.hasProcessOutput('Emitting event: resetAdmission')).toBe(false)
      }
      scenarioPassed = true
    },
    qssEnabled ? 180_000 : 1_200_000
  )
})

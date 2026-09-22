import fs from 'fs'
import os from 'os'
import path from 'path'
import { spawn, type ChildProcess } from 'child_process'
import {
  App,
  Channel,
  CreateCommunityModal,
  JoinCommunityModal,
  JoiningLoadingPanel,
  NewMessage,
  RegisterUsernameModal,
  ServerOfferModal,
  Sidebar,
  TermsOfServiceModal,
} from '../selectors'
import { FileAttachmentType, SettingsModalTabName } from '../enums'
import { TestChannelType } from '../types'

// Explicit opt-in: this suite needs a built Android app and a dedicated emulator as well as Electron.
const suite = process.env.QUIET_DM_ANDROID_DEVICE ? describe : describe.skip
suite('Participant-only DMs across desktop and Android', () => {
  const admin = new App({ username: 'dm-admin' })
  const bob = new App({ username: 'dm-bob' })
  const desktopUser = 'dm-bob'
  const mobileUser = 'dm-carol'
  let directory: string
  let mobile: ChildProcess | undefined
  let mobileFinished: Promise<number | null>
  const waitForMarker = async (name: string) => {
    const deadline = Date.now() + 600_000
    while (!fs.existsSync(path.join(directory, name))) {
      if (mobile?.exitCode != null) throw new Error(`Android exited before ${name}; see ${directory}/android.log`)
      if (Date.now() > deadline) throw new Error(`Android did not reach ${name}; see ${directory}/android.log`)
      await new Promise(resolve => setTimeout(resolve, 250))
    }
  }
  const getInvite = async () => {
    const settings = await new Sidebar(admin.driver).openSettings()
    await settings.switchTab(SettingsModalTabName.INVITE)
    const invitation = await (await settings.invitationLink()).getText()
    await settings.closeTabThenModal()
    return invitation
  }
  const register = async (app: App, name: string) => {
    const registration = new RegisterUsernameModal(app.driver)
    await registration.isReady()
    await registration.typeUsername(name)
    await registration.submit()
    const terms = new TermsOfServiceModal(app.driver)
    await terms.isReady()
    await terms.chooseAgreeAndJoin()
  }

  afterAll(async () => {
    mobile?.kill('SIGTERM')
    await Promise.allSettled([admin.close(), bob.close()])
    // Retain logs on failure for review. Invitation data remains in an owner-only directory.
  }, 60_000)

  it('keeps the admin outside while participants exchange a file and catch up through QSS after restart', async () => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), 'quiet-dm-cross-platform-'))
    fs.chmodSync(directory, 0o700)
    await admin.open(true)
    const joinAdmin = new JoinCommunityModal(admin.driver)
    await joinAdmin.isReady()
    await joinAdmin.switchToCreateCommunity()
    const create = new CreateCommunityModal(admin.driver)
    await create.typeCommunityName('dm-security')
    await create.submit()
    const offer = new ServerOfferModal(admin.driver)
    await offer.isReady()
    await offer.chooseUseServer()
    await register(admin, 'dm-admin')
    await new Channel(admin.driver, 'general').isOpen()
    const invitation = await getInvite()

    await bob.open(true)
    const joinBob = new JoinCommunityModal(bob.driver)
    await joinBob.isReady()
    await joinBob.typeCommunityInviteLink(invitation)
    await joinBob.submit()
    await register(bob, desktopUser)
    await new JoiningLoadingPanel(bob.driver).waitForJoinToComplete()
    await new Channel(bob.driver, 'general').isOpen()

    const scenario = {
      invitation: await getInvite(),
      desktopUser,
      mobileUser,
      firstMessage: 'A private message from desktop to Android',
      mobileReply: 'Android authenticated the message and file',
      offlineReply: 'Android sent this after restart while desktop was offline',
      filename: 'dm-confidential.txt',
      fileContents: 'Private attachment with authenticated end of stream.\n',
    }
    const scenarioPath = path.join(directory, 'scenario.json')
    fs.writeFileSync(scenarioPath, JSON.stringify(scenario), { mode: 0o600 })
    const mobileDirectory = path.resolve(__dirname, '../../../mobile')
    const log = fs.openSync(path.join(directory, 'android.log'), 'w', 0o600)
    mobile = spawn(
      path.join(mobileDirectory, 'node_modules/.bin/detox'),
      [
        'test',
        '--configuration',
        'android.att.e2e.qss',
        '--device-name',
        process.env.QUIET_DM_ANDROID_DEVICE!,
        '--cleanup',
        'e2e/secure-dms.test.js',
      ],
      { cwd: mobileDirectory, env: { ...process.env, QUIET_DM_SCENARIO: scenarioPath }, stdio: ['ignore', log, log] }
    )
    mobileFinished = new Promise((resolve, reject) => {
      mobile!.once('exit', resolve)
      mobile!.once('error', reject)
    })
    await waitForMarker('mobile-joined')

    const newMessage = new NewMessage(bob.driver)
    await newMessage.open()
    expect((await newMessage.createNewDm([mobileUser], scenario.firstMessage)).success).toBe(true)
    let dm = new Channel(bob.driver, mobileUser)
    await dm.isOpen(TestChannelType.DM)
    await dm.getMessageIdsByText(scenario.firstMessage, desktopUser)
    const file = path.join(directory, scenario.filename)
    fs.writeFileSync(file, scenario.fileContents, { mode: 0o600 })
    await dm.attachFile(scenario.filename, file, FileAttachmentType.FILE, desktopUser)
    await waitForMarker('mobile-received')
    await dm.getMessageIdsByText(scenario.mobileReply, mobileUser)
    expect(await new Sidebar(admin.driver).waitForDmChannelsNum(0)).toBe(true)

    await bob.close()
    fs.writeFileSync(path.join(directory, 'desktop-offline'), 'ready')
    await waitForMarker('mobile-finished')
    expect(await mobileFinished).toBe(0)
    await bob.open(true)
    dm = await new Sidebar(bob.driver).switchDm(mobileUser)
    await dm.getMessageIdsByText(scenario.offlineReply, mobileUser)
    await dm.getMessageIdsByText(scenario.firstMessage, desktopUser)
    expect(await new Sidebar(admin.driver).waitForDmChannelsNum(0)).toBe(true)
    fs.unlinkSync(scenarioPath)
  }, 1_500_000)
})

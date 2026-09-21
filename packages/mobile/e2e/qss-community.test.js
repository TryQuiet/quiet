/* global device, element, by, waitFor */
import {
  createQssCommunity,
  openGeneral,
  sendStoredMessage,
  readQssInvitation,
  closeQssInvitation,
} from './utils/qssUi'

const {
  validateBuild,
  validateFixture,
  checkLiveFixture,
  prepareRun,
  writeProof,
  waitForServerProof,
} = require('./utils/qssCommunity.cjs')

// This suite only runs against an explicitly prepared, local QSS fixture.
// Captcha completes in the real WebView with hCaptcha's public test site key.
describe('QSS community with the real native backend', () => {
  let fixture
  let run
  let launched = false

  beforeAll(async () => {
    const config = require('detox/internals').config
    if (device.getPlatform() !== 'ios' || config.configurationName !== 'ios.sim.e2e.qss') {
      throw new Error('Use the dedicated ios.sim.e2e.qss configuration on an owned simulator')
    }
    if (!process.env.DETOX_IOS_SIMULATOR_ID || device.id !== process.env.DETOX_IOS_SIMULATOR_ID) {
      throw new Error('Select the exact owned simulator using DETOX_IOS_SIMULATOR_ID')
    }
    const build = validateBuild(process.env.DETOX_IOS_ARM64_E2E_QSS_OUTPUT)
    const apps = Object.values(config.apps)
    if (apps.length !== 1 || require('node:path').resolve(apps[0].binaryPath) !== build.app) {
      throw new Error('Detox must install the exact app verified by the QSS build receipt')
    }
    run = prepareRun(process.env.QUIET_QSS_E2E_RUN_DIR)
    fixture = validateFixture(run.fixture)
    await checkLiveFixture()
    await device.launchApp({ delete: true, newInstance: true, permissions: { notifications: 'YES' } })
    launched = true
    await device.setOrientation('portrait')
  })

  afterAll(async () => {
    if (launched) await device.terminateApp()
  })

  it('registers with QSS, stores a message, exposes its v5 invite, and restores after restart', async () => {
    const communityName = `qss-native-${run.runId.slice(-16)}`
    const message = `Quiet QSS native message ${run.runId.slice(-16)}`
    await createQssCommunity(communityName, 'qssnativeowner')
    await openGeneral()
    const { metadata } = await readQssInvitation(communityName)
    const proof = { ...metadata, fixtureProject: fixture.project, messageStored: false, restarted: false }
    writeProof(run, proof)
    // Record aggregate QSS activity for this exact team across the send. The
    // encrypted records cannot identify this message; offline peer retrieval
    // in the mixed suite provides that separate message-specific proof.
    const serverBaseline = await waitForServerProof(run, metadata.teamId, fixture.project)
    await closeQssInvitation()
    await openGeneral()
    await sendStoredMessage(message)
    proof.messageStored = true
    writeProof(run, { ...proof, serverBaseline })
    const serverActivityAfterSend = await waitForServerProof(run, metadata.teamId, fixture.project, {
      afterSyncSeq: serverBaseline.maxSyncSeq,
    })
    writeProof(run, { ...proof, serverBaseline, serverActivityAfterSend })

    await device.terminateApp()
    await device.launchApp({ newInstance: true })
    await waitFor(element(by.id('channels_list')))
      .toBeVisible()
      .withTimeout(120000)
    const displayedName = communityName[0].toUpperCase() + communityName.slice(1)
    // Bundled iOS debug builds can briefly display the native Metro banner.
    await waitFor(element(by.text(displayedName)))
      .toBeVisible()
      .withTimeout(20000)
    await openGeneral()
    await waitFor(element(by.id(message).withAncestor(by.id('message-stored'))))
      .toBeVisible()
      .withTimeout(30000)
    writeProof(run, { ...proof, serverBaseline, serverActivityAfterSend, restarted: true })
  }, 420000)
})

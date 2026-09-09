/* global device, element, by, waitFor */
import { expect as assert } from '@jest/globals'
import {
  App,
  Channel,
  JoinCommunityModal,
  RegisterUsernameModal,
  TermsOfServiceModal,
  JoiningLoadingPanel,
} from '../../e2e-tests/src/selectors'
import {
  createQssCommunity,
  openGeneral,
  sendStoredMessage,
  readQssInvitation,
  closeQssInvitation,
} from './utils/qssUi'
const fs = require('fs')
const path = require('path')
const {
  validateBuild,
  validateFixture,
  checkLiveFixture,
  prepareRun,
  writeProof,
  waitForServerProof,
} = require('./utils/qssCommunity.cjs')
const { snapshotOwnedProcesses, waitForProcessExit } = require('./utils/desktopProcesses.cjs')

// The same macOS host runs Detox and the existing Selenium App/Channel helpers.
// Build both applications from this checkout with .env.e2e.qss before running.
describe('Desktop and iOS clients with QSS', () => {
  let desktop
  let general
  let run
  let fixture
  let invitation
  let metadata
  let names
  let messages
  let desktopProcesses = []
  let mobileLaunched = false

  const launchMobile = async fresh => {
    await device.launchApp({
      newInstance: true,
      ...(fresh ? { delete: true, permissions: { notifications: 'YES' } } : {}),
    })
    mobileLaunched = true
  }

  const stopMobile = async () => {
    if (mobileLaunched) await device.terminateApp()
    mobileLaunched = false
  }

  const stopDesktop = async () => {
    if (desktop?.isOpened) {
      desktopProcesses = snapshotOwnedProcesses(desktop.buildSetup.child.pid)
      await desktop.close()
      // App-window disappearance alone cannot establish QSS-only delivery.
      await waitForProcessExit(desktopProcesses)
    }
  }

  const launchDesktop = async () => {
    if (desktopProcesses.length) await waitForProcessExit(desktopProcesses)
    const before = { ...process.env }
    await desktop.open(true)
    // Launch settings must not leak into Detox in this combined Jest process.
    for (const key of ['DATA_DIR', 'STATIC_LOG_ID', 'QSS_ALLOWED', 'QSS_ENDPOINT', 'DEBUG']) {
      assert(process.env[key]).toBe(before[key])
    }
    general = new Channel(desktop.driver, 'general')
  }

  const mobileMessage = async (text, username) => {
    await waitFor(
      element(
        by
          .id(text)
          .withAncestor(by.id('message-stored'))
          .withAncestor(by.id(`userMessages-${username}`))
      )
    )
      .toBeVisible()
      .withTimeout(60000)
  }

  beforeAll(async () => {
    const config = require('detox/internals').config
    if (
      process.platform !== 'darwin' ||
      device.getPlatform() !== 'ios' ||
      config.configurationName !== 'ios.sim.e2e.qss'
    ) {
      throw new Error('Run both clients on macOS with ios.sim.e2e.qss')
    }
    if (!process.env.DETOX_IOS_SIMULATOR_ID || device.id !== process.env.DETOX_IOS_SIMULATOR_ID) {
      throw new Error('Select the exact owned simulator using DETOX_IOS_SIMULATOR_ID')
    }
    const binary = process.env.QUIET_DESKTOP_BINARY
    if (!binary || !path.isAbsolute(binary) || !fs.statSync(binary).isFile()) {
      throw new Error("Set QUIET_DESKTOP_BINARY to this checkout's packaged Quiet.app/Contents/MacOS/Quiet")
    }
    const build = validateBuild(process.env.DETOX_IOS_ARM64_E2E_QSS_OUTPUT)
    const apps = Object.values(config.apps)
    if (apps.length !== 1 || path.resolve(apps[0].binaryPath) !== build.app) {
      throw new Error('Detox must install the exact app verified by the QSS build receipt')
    }
    run = prepareRun(process.env.QUIET_QSS_E2E_RUN_DIR)
    fixture = validateFixture(run.fixture)
    await checkLiveFixture()
    const suffix = run.runId.slice(-12)
    names = { community: `mixed-${suffix}`, mobile: `ios-${suffix}`, desktop: `desktop-${suffix}` }
    messages = {
      seed: `iOS before desktop joined ${suffix}`,
      desktopOnline: `Desktop to iOS online ${suffix}`,
      mobileOnline: `iOS to desktop online ${suffix}`,
      desktopOffline: `Desktop while iOS offline ${suffix}`,
      mobileOffline: `iOS while desktop offline ${suffix}`,
    }
    desktop = new App({ binaryPath: binary, username: names.desktop, qssEndpoint: fixture.endpoint })
    await launchMobile(true)
    await device.setOrientation('portrait')
  })

  afterAll(async () => {
    try {
      await stopMobile()
    } finally {
      await stopDesktop()
      if (desktop) await desktop.cleanup()
    }
  })

  describe('Stages', () => {
    it('iOS creates a server community and stores history before going offline', async () => {
      await createQssCommunity(names.community, names.mobile)
      await openGeneral()
      const result = await readQssInvitation(names.community)
      invitation = result.rawInvite
      metadata = result.metadata
      writeProof(run, metadata)
      const before = await waitForServerProof(run, metadata.teamId, fixture.project)
      await closeQssInvitation()
      await openGeneral()
      await sendStoredMessage(messages.seed)
      await waitForServerProof(run, metadata.teamId, fixture.project, { afterSyncSeq: before.maxSyncSeq })
      await stopMobile()
    })

    it('desktop joins the exact iOS invitation and retrieves history with iOS offline', async () => {
      assert(mobileLaunched).toBe(false)
      await launchDesktop()
      const join = new JoinCommunityModal(desktop.driver)
      assert(await join.isReady()).toBe(true)
      await join.typeCommunityInviteLink(invitation)
      await join.submit()
      invitation = undefined
      const registration = new RegisterUsernameModal(desktop.driver)
      assert(await registration.isReady()).toBe(true)
      await registration.typeUsername(names.desktop)
      await registration.submit()
      const terms = new TermsOfServiceModal(desktop.driver)
      assert(await terms.isReady(30000)).toBe(true)
      await terms.chooseAgreeAndJoin()
      await new JoiningLoadingPanel(desktop.driver).waitForJoinToComplete()
      assert(await general.isOpen()).toBe(true)
      await general.waitForExactMessage(messages.seed, names.mobile)
    })

    it('both clients receive messages from each other while online', async () => {
      await launchMobile(false)
      await openGeneral()
      await general.sendMessage(messages.desktopOnline, names.desktop)
      await mobileMessage(messages.desktopOnline, names.desktop)
      await sendStoredMessage(messages.mobileOnline)
      await general.waitForExactMessage(messages.mobileOnline, names.mobile)
    })

    it('iOS catches up after being offline, with desktop terminated during retrieval', async () => {
      await stopMobile()
      const before = await waitForServerProof(run, metadata.teamId, fixture.project)
      await general.sendMessage(messages.desktopOffline, names.desktop)
      await waitForServerProof(run, metadata.teamId, fixture.project, { afterSyncSeq: before.maxSyncSeq })
      // Require a real restart to establish desktop persistence, then remove
      // every owned desktop process before asking iOS to retrieve the message.
      await stopDesktop()
      await launchDesktop()
      await general.waitForExactMessage(messages.desktopOffline, names.desktop)
      await stopDesktop()
      await launchMobile(false)
      await openGeneral()
      await mobileMessage(messages.desktopOffline, names.desktop)
    })

    it('desktop catches up after being offline, with iOS terminated during retrieval', async () => {
      await waitForProcessExit(desktopProcesses)
      const before = await waitForServerProof(run, metadata.teamId, fixture.project)
      await sendStoredMessage(messages.mobileOffline)
      await waitForServerProof(run, metadata.teamId, fixture.project, { afterSyncSeq: before.maxSyncSeq })
      await stopMobile()
      await launchDesktop()
      await general.waitForExactMessage(messages.mobileOffline, names.mobile)
    })

    it('both clients preserve the conversation through another restart', async () => {
      await stopDesktop()
      await launchDesktop()
      for (const key of ['seed', 'mobileOnline', 'mobileOffline']) {
        await general.waitForExactMessage(messages[key], names.mobile)
      }
      for (const key of ['desktopOnline', 'desktopOffline']) {
        await general.waitForExactMessage(messages[key], names.desktop)
      }
      await stopDesktop()
      await launchMobile(false)
      await openGeneral()
      for (const [key, text] of Object.entries(messages)) {
        await mobileMessage(text, key.startsWith('desktop') ? names.desktop : names.mobile)
      }
      writeProof(run, { ...metadata, twoPlayerPassed: true, desktopSource: 'same checkout' })
    })
  })
})

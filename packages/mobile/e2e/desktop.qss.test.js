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
  validateFixture,
  checkLiveFixture,
  prepareRun,
  writeProof,
  waitForServerProof,
} = require('./utils/qssCommunity.cjs')
const { snapshotOwnedProcesses, waitForProcessExit } = require('./utils/desktopProcesses.cjs')
const { createQssMobile } = require('./utils/qssMobile.cjs')
const { validateDesktopQssOnlyBuild } = require('./utils/qssOnlyBuild.cjs')

// The same host runs Detox and the existing Selenium App/Channel helpers.
// Build both applications from this checkout with .env.e2e.qss before running.
describe('Desktop and mobile clients with QSS', () => {
  let desktop
  let general
  let run
  let fixture
  let invitation
  let metadata
  let names
  let messages
  let desktopProcesses = []
  let mobile
  let desktopBuild

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
    if (!['darwin', 'linux'].includes(process.platform)) throw new Error('Run both clients on a macOS or Linux host')
    const binary = process.env.QUIET_DESKTOP_BINARY
    if (!binary || !path.isAbsolute(binary) || !fs.statSync(binary).isFile()) {
      throw new Error("Set QUIET_DESKTOP_BINARY to this checkout's packaged Quiet executable")
    }
    mobile = createQssMobile(device, config)
    if (mobile.build.backendMode === 'qss-only') {
      if (process.env.IS_E2E !== 'true') throw new Error('QSS-only desktop launch requires IS_E2E=true')
      desktopBuild = validateDesktopQssOnlyBuild(binary, process.env.QUIET_QSS_ONLY_BUILD_RECEIPT)
    }
    run = prepareRun(process.env.QUIET_QSS_E2E_RUN_DIR)
    fixture = validateFixture(run.fixture)
    await checkLiveFixture()
    const suffix = run.runId.slice(-12)
    names = { community: `mixed-${suffix}`, mobile: `${mobile.platform}-${suffix}`, desktop: `desktop-${suffix}` }
    // Android's native keyboard capitalizes the beginning of a sentence.
    // Use the platform's display name and keep exact message assertions.
    const platformLabel = mobile.platform === 'android' ? 'Android' : 'iOS'
    messages = {
      seed: `${platformLabel} before desktop joined ${suffix}`,
      desktopOnline: `Desktop to ${platformLabel} online ${suffix}`,
      mobileOnline: `${platformLabel} to desktop online ${suffix}`,
      desktopOffline: `Desktop while ${platformLabel} offline ${suffix}`,
      mobileOffline: `${platformLabel} while desktop offline ${suffix}`,
    }
    desktop = new App({ binaryPath: binary, username: names.desktop, qssEndpoint: fixture.endpoint })
    await mobile.launch(true)
    await device.setOrientation('portrait')
  })

  afterAll(async () => {
    try {
      if (mobile) await mobile.stop()
    } finally {
      await stopDesktop()
      if (desktop) await desktop.cleanup()
    }
  })

  describe('Stages', () => {
    it('mobile creates a server community and stores history before going offline', async () => {
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
      await mobile.stop()
    })

    it('desktop joins the exact mobile invitation and retrieves history with mobile offline', async () => {
      await mobile.assertStopped()
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
      await mobile.assertStopped()
    })

    it('both clients receive messages from each other while online', async () => {
      await mobile.launch()
      await openGeneral()
      await general.sendMessage(messages.desktopOnline, names.desktop)
      await mobileMessage(messages.desktopOnline, names.desktop)
      await sendStoredMessage(messages.mobileOnline)
      await general.waitForExactMessage(messages.mobileOnline, names.mobile)
    })

    it('mobile catches up after being offline, with desktop terminated during retrieval', async () => {
      await mobile.stop()
      const before = await waitForServerProof(run, metadata.teamId, fixture.project)
      await general.sendMessage(messages.desktopOffline, names.desktop)
      await waitForServerProof(run, metadata.teamId, fixture.project, { afterSyncSeq: before.maxSyncSeq })
      // Require a real restart to establish desktop persistence, then remove
      // every owned desktop process before asking mobile to retrieve the message.
      await stopDesktop()
      await launchDesktop()
      await general.waitForExactMessage(messages.desktopOffline, names.desktop)
      await stopDesktop()
      await mobile.launch()
      await openGeneral()
      await mobileMessage(messages.desktopOffline, names.desktop)
      await waitForProcessExit(desktopProcesses)
    })

    it('desktop catches up after being offline, with mobile terminated during retrieval', async () => {
      await waitForProcessExit(desktopProcesses)
      const before = await waitForServerProof(run, metadata.teamId, fixture.project)
      await sendStoredMessage(messages.mobileOffline)
      await waitForServerProof(run, metadata.teamId, fixture.project, { afterSyncSeq: before.maxSyncSeq })
      await mobile.stop()
      await launchDesktop()
      await general.waitForExactMessage(messages.mobileOffline, names.mobile)
      await mobile.assertStopped()
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
      await mobile.launch()
      await openGeneral()
      for (const [key, text] of Object.entries(messages)) {
        await mobileMessage(text, key.startsWith('desktop') ? names.desktop : names.mobile)
      }
      writeProof(run, {
        ...metadata,
        twoPlayerPassed: true,
        mobilePlatform: mobile.platform,
        mobileBuild: mobile.build,
        ...(desktopBuild ? { desktopBuild } : {}),
        mobileOfflineChecks: mobile.offlineProofs,
        desktopSource: 'same checkout',
      })
    })
  })
})

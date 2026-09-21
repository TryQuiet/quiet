import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import { createRequire } from 'node:module'
import selectors from '../../../e2e-tests/src/selectors.ts'
const { App, Channel, Sidebar, JoinCommunityModal, CreateCommunityModal, ServerOfferModal, RegisterUsernameModal, TermsOfServiceModal, JoiningLoadingPanel } = selectors
const require = createRequire(import.meta.url)
const { snapshotOwnedProcesses, waitForProcessExit, stopOwnedProcesses } = require('../utils/desktopProcesses.cjs')

export class Desktop {
  constructor(config, names, fixture) {
    this.names = names
    this.app = new App({ binaryPath: config.desktopBinary, username: names.desktop, qssEndpoint: fixture.endpoint,
      environment: { ...(config.display ? { DISPLAY: config.display } : {}) },
      ...(config.chromeDriverPath ? { chromeDriverPath: config.chromeDriverPath } : {}),
    })
  }
  get driver() { return this.app.driver }
  async create() {
    await this.app.open(true)
    this.owned = snapshotOwnedProcesses(this.app.buildSetup.child.pid)
    await new JoinCommunityModal(this.driver).switchToCreateCommunity()
    const create = new CreateCommunityModal(this.driver)
    await create.typeCommunityName(this.names.community)
    await create.submit()
    await new ServerOfferModal(this.driver).chooseUseServer()
    const registration = new RegisterUsernameModal(this.driver)
    await registration.typeUsername(this.names.desktop)
    await registration.submit()
    await new TermsOfServiceModal(this.driver).chooseAgreeAndJoin()
    await new JoiningLoadingPanel(this.driver).waitForJoinToComplete()
    assert(await new Channel(this.driver, 'general').isOpen())
    const settings = await new Sidebar(this.driver).openSettings()
    await settings.switchTab('invite')
    const invite = await (await settings.invitationLink()).getText()
    await settings.closeTabThenModal()
    return invite
  }
  async send(text, channel = 'general') {
    const target = await new Sidebar(this.driver).switchChannel(channel)
    await target.sendMessage(text, this.names.desktop)
    await target.waitForExactMessage(text, this.names.desktop)
  }
  async addChannel(name) { await new Sidebar(this.driver).addNewChannel(name) }
  async artifacts(directory) {
    if (!this.app.isOpened) return
    await fs.writeFile(path.join(directory, 'desktop-failure.html'), await this.driver.getPageSource(), { mode: 0o600 })
    await fs.writeFile(path.join(directory, 'desktop-failure.png'), Buffer.from(await this.driver.takeScreenshot(), 'base64'), { mode: 0o600 })
  }
  async close() {
    let owned = this.owned || []
    try {
      if (this.app.buildSetup.child?.pid) owned = snapshotOwnedProcesses(this.app.buildSetup.child.pid)
    } catch {
      // ChromeDriver may already have crashed; retain the last live snapshot.
    }
    try {
      await this.app.close()
    } finally {
      try { await waitForProcessExit(owned, 3000) } catch { await stopOwnedProcesses(owned) }
      await this.app.cleanup()
    }
  }
}

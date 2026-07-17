import { jest } from '@jest/globals'

import {
  App,
  Channel,
  CreateCommunityModal,
  JoinCommunityModal,
  JoiningLoadingPanel,
  RegisterUsernameModal,
  ServerAddedModal,
  Sidebar,
} from '../selectors'
import { SettingsModalTabName } from '../enums'

jest.setTimeout(600_000)

describe('Unknown Server Warning', () => {
  const communityName = 'unknown-server-test'
  const ownerUsername = 'server-test-owner'
  const memberUsername = 'server-test-member'
  const unknownServerHost = 'unknown-server.example.com'
  const readyMessage = 'Ready to receive server updates'

  const ownerApp = new App({ username: ownerUsername })
  const memberApp = new App({ username: memberUsername })

  afterAll(async () => {
    for (const app of [ownerApp, memberApp]) {
      await app.close()
      await app.cleanup()
    }
  })

  it('warns another user when an admin adds an unknown server from the debug sidebar', async () => {
    await ownerApp.openWithRetries()

    const ownerJoinModal = new JoinCommunityModal(ownerApp.driver)
    expect(await ownerJoinModal.isReady()).toBeTruthy()
    await ownerJoinModal.switchToCreateCommunity()

    const createModal = new CreateCommunityModal(ownerApp.driver)
    expect(await createModal.isReady()).toBeTruthy()
    await createModal.typeCommunityName(communityName)
    await createModal.submit()

    const ownerRegisterModal = new RegisterUsernameModal(ownerApp.driver)
    expect(await ownerRegisterModal.isReady()).toBeTruthy()
    await ownerRegisterModal.typeUsername(ownerUsername)
    await ownerRegisterModal.submit()
    await new JoiningLoadingPanel(ownerApp.driver).waitForJoinToComplete()

    const ownerChannel = new Channel(ownerApp.driver, 'general')
    expect(await ownerChannel.isReady()).toBeTruthy()

    const inviteSettings = await new Sidebar(ownerApp.driver).openSettings()
    expect(await inviteSettings.isReady()).toBeTruthy()
    await inviteSettings.switchTab(SettingsModalTabName.INVITE)
    const invitationLink = await (await inviteSettings.invitationLink()).getText()
    await inviteSettings.closeTabThenModal()

    await memberApp.openWithRetries()
    const memberJoinModal = new JoinCommunityModal(memberApp.driver)
    expect(await memberJoinModal.isReady()).toBeTruthy()
    await memberJoinModal.typeCommunityInviteLink(invitationLink)
    await memberJoinModal.submit()

    const memberRegisterModal = new RegisterUsernameModal(memberApp.driver)
    expect(await memberRegisterModal.isReady()).toBeTruthy()
    await memberRegisterModal.typeUsername(memberUsername)
    await memberRegisterModal.submit()
    await new JoiningLoadingPanel(memberApp.driver).waitForJoinToComplete()

    const memberChannel = new Channel(memberApp.driver, 'general')
    expect(await memberChannel.isReady()).toBeTruthy()
    await memberChannel.sendMessage(readyMessage, memberUsername)
    await ownerChannel.getMessageIdsByText(readyMessage, memberUsername, 120_000)

    const debugSettings = await new Sidebar(ownerApp.driver).openSettings()
    expect(await debugSettings.isReady()).toBeTruthy()
    await debugSettings.openDebugTab()
    await debugSettings.addServerToCommunity(unknownServerHost)
    await debugSettings.closeTabThenModal()

    const serverAddedModal = new ServerAddedModal(memberApp.driver)
    expect(await serverAddedModal.isReady()).toBeTruthy()
    expect(await serverAddedModal.getTitle()).toEqual('This community is hosted on a server')
    expect(await serverAddedModal.getMessage()).toContain(unknownServerHost)

    // Keep the validated warning visible long enough for a manual visual check before cleanup closes the app.
    await memberApp.driver.sleep(5_000)
  })
})

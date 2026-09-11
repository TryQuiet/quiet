import { By, until } from 'selenium-webdriver'

import {
  App,
  Channel,
  CreateCommunityModal,
  JoinCommunityModal,
  JoiningLoadingPanel,
  RegisterUsernameModal,
  Sidebar,
  UserProfileContextMenu,
} from '../selectors'
import { createLogger } from '../logger'
import { PhotoExt, SettingsModalTabName, X_DATA_TESTID } from '../enums'
import { MessageIds, UserTestData } from '../types'

const logger = createLogger('userProfile')

jest.setTimeout(900000)

describe('User Profile Feature', () => {
  let generalChannelOwner: Channel
  let generalChannelUser1: Channel
  let invitationLink: string
  let ownerMessageIds: MessageIds

  let users: Record<string, UserTestData>
  const communityName = 'testcommunity'

  beforeAll(async () => {
    users = {
      owner: {
        username: 'owner',
        messages: ['Hi', 'Hello', 'After guest left the app'],
        app: new App({ username: 'owner' }),
      },
      user1: {
        username: 'user-joining-1',
        messages: [],
        app: new App({ username: 'user-joining-1' }),
      },
    }
  })

  afterAll(async () => {
    for (const user of Object.values(users)) {
      await user.app.close()
      await user.app.cleanup()
    }
  })

  beforeEach(async () => {
    logger.info(`░░░ ${expect.getState().currentTestName}`)
  })

  it('Owner opens the app', async () => {
    await users.owner.app.open()
  })

  it('Owner sees "join community" modal and switches to "create community" modal', async () => {
    const joinModal = new JoinCommunityModal(users.owner.app.driver)
    expect(await joinModal.isReady()).toBeTruthy()
    await joinModal.switchToCreateCommunity()
  })

  it('Owner submits valid community name', async () => {
    const createModal = new CreateCommunityModal(users.owner.app.driver)
    expect(await createModal.isReady()).toBeTruthy()
    await createModal.typeCommunityName(communityName)
    await createModal.submit()
  })

  it('Owner sees "register username" modal and submits valid username', async () => {
    const registerModal = new RegisterUsernameModal(users.owner.app.driver)
    expect(await registerModal.isReady()).toBeTruthy()
    await registerModal.typeUsername(users.owner.username)
    await registerModal.submit()
  })

  it('Owner registers successfully and sees general channel', async () => {
    generalChannelOwner = new Channel(users.owner.app.driver, 'general')
    expect(await generalChannelOwner.isReady())

    const generalChannelText = await generalChannelOwner.element.getText()
    expect(generalChannelText).toEqual('general')
  })

  it('Owner sends a message', async () => {
    expect(await generalChannelOwner.isMessageInputReady()).toBeTruthy()
    ownerMessageIds = await generalChannelOwner.sendMessage(users.owner.messages[0], users.owner.username)
  })

  it('Owner updates their profile photo with JPEG', async () => {
    logger.info('JPEG')
    const menu = new UserProfileContextMenu(users.owner.app.driver)
    await menu.openMenu()
    await menu.openEditProfileMenu()
    await menu.uploadJPEGPhoto()

    const imgSrc = await menu.getProfilePhotoSrc(PhotoExt.JPG)

    await menu.back(X_DATA_TESTID.EDIT_PROFILE)
    await menu.isMenuReady()
    await menu.back(X_DATA_TESTID.PROFILE)
    await generalChannelOwner.isMessageInputReady()
  })

  // Functionality disabled until support is added again
  it.skip('Owner updates their profile photo with GIF', async () => {
    logger.info('GIF')
    const menu = new UserProfileContextMenu(users.owner.app.driver)
    await menu.openMenu()
    await menu.openEditProfileMenu()
    await menu.uploadGIFPhoto()

    const imgSrc = await menu.getProfilePhotoSrc(PhotoExt.GIF)

    await menu.back(X_DATA_TESTID.EDIT_PROFILE)
    await menu.isMenuReady()
    await menu.back(X_DATA_TESTID.PROFILE)
    await generalChannelOwner.isMessageInputReady()
  })

  it('Owner updates their profile photo with PNG', async () => {
    logger.info('PNG')
    const menu = new UserProfileContextMenu(users.owner.app.driver)
    await menu.openMenu()
    await menu.openEditProfileMenu()
    await menu.uploadPNGPhoto()

    const imgSrc = await menu.getProfilePhotoSrc(PhotoExt.PNG)

    await menu.back(X_DATA_TESTID.EDIT_PROFILE)
    await menu.isMenuReady()
    await menu.back(X_DATA_TESTID.PROFILE)
    await generalChannelOwner.isMessageInputReady()
  })

  it('Owner opens the settings tab and gets an invitation link', async () => {
    const settingsModal = await new Sidebar(users.owner.app.driver).openSettings()
    expect(await settingsModal.isReady()).toBeTruthy()
    await settingsModal.switchTab(SettingsModalTabName.INVITE)
    const invitationLinkElement = await settingsModal.invitationLink()
    invitationLink = await invitationLinkElement.getText()
    expect(invitationLink).not.toBeUndefined()
    logger.info('Received invitation link:', invitationLink)
    await settingsModal.closeTabThenModal()
  })

  it('First user opens the app', async () => {
    await users.user1.app.open()
  })

  it('First user submits invitation link received from owner', async () => {
    const joinCommunityModal = new JoinCommunityModal(users.user1.app.driver)
    expect(await joinCommunityModal.isReady()).toBeTruthy()
    await joinCommunityModal.typeCommunityInviteLink(invitationLink)
    await joinCommunityModal.submit()
  })

  it('First user submits valid username', async () => {
    const registerModal = new RegisterUsernameModal(users.user1.app.driver)
    expect(await registerModal.isReady()).toBeTruthy()
    await registerModal.clearInput()
    await registerModal.typeUsername(users.user1.username)
    await registerModal.submit()
  })

  it('First user waits to join the community', async () => {
    const joinPanel = new JoiningLoadingPanel(users.user1.app.driver)
    await joinPanel.waitForJoinToComplete()
  })

  it('First user joins successfully sees general channel', async () => {
    generalChannelUser1 = new Channel(users.user1.app.driver, 'general')
    expect(await generalChannelUser1.isReady()).toBeTruthy()
    expect(await generalChannelUser1.isMessageInputReady()).toBeTruthy()
  })

  it("First user sees owner's message with profile photo", async () => {
    // Follow the message actually sent by the owner. Its position can change as
    // historical and system messages arrive during initial replication.
    const elem = await generalChannelUser1.waitForMessageContentById(ownerMessageIds.messageId)
    await users.user1.app.driver.wait(until.elementIsVisible(elem), 60_000)
    const text = await elem.getText()
    expect(text).toEqual(users.owner.messages[0])

    const img = await users.user1.app.driver.wait(
      async () => {
        const message = await users.user1.app.driver.findElement(
          By.css(`[data-testid="messagesGroupContent-${ownerMessageIds.messageId}"]`)
        )
        const wrapper = await message.findElement(
          By.xpath('./ancestor::*[starts-with(@data-testid, "userMessagesWrapper-")][1]')
        )
        const images = await wrapper.findElements(By.css(`img[alt="${users.owner.username}"]`))
        const image = images[0]
        if (
          image &&
          (await image.isDisplayed()) &&
          (await image.getAttribute('src')).endsWith(PhotoExt.PNG) &&
          (await users.user1.app.driver.executeScript<boolean>(
            'return arguments[0].complete && arguments[0].naturalWidth > 0',
            image
          ))
        ) {
          return image
        }
        return undefined
      },
      60_000,
      'Owner profile image did not become visible'
    )
    if (!img) {
      fail('Owner profile image did not become visible')
    }
    await users.user1.app.driver.wait(until.elementIsVisible(img), 5_000)
  })
})

import { By, until } from 'selenium-webdriver'

import {
  App,
  Channel,
  CreateCommunityModal,
  JoinCommunityModal,
  RegisterUsernameModal,
  Sidebar,
  UserProfileContextMenu,
} from '../selectors'
import logger from '../logger'
import { EXPECTED_IMG_SRC_GIF, EXPECTED_IMG_SRC_JPEG, EXPECTED_IMG_SRC_PNG } from '../profilePhoto.const'
import { sleep } from '../utils'
import { BACK_ARROW_DATA_TESTID } from '../enums'

const log = logger('userProfile')

interface UserTestData {
  username: string
  app: App
  messages: string[]
}

jest.setTimeout(900000)

describe('User Profile Feature', () => {
  let generalChannelOwner: Channel
  let generalChannelUser1: Channel
  let invitationCode: string

  let users: Record<string, UserTestData>
  const communityName = 'testcommunity'

  beforeAll(async () => {
    users = {
      owner: {
        username: 'owner',
        messages: ['Hi', 'Hello', 'After guest left the app'],
        app: new App(),
      },
      user1: {
        username: 'user-joining-1',
        messages: [],
        app: new App(),
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
    await sleep(1000)
  })

  it('Owner opens the app', async () => {
    await users.owner.app.open()
  })

  it('Owner sees "join community" modal and switches to "create community" modal', async () => {
    const joinModal = new JoinCommunityModal(users.owner.app.driver)
    const isJoinModal = await joinModal.element.isDisplayed()
    expect(isJoinModal).toBeTruthy()
    await joinModal.switchToCreateCommunity()
  })

  it('Owner submits valid community name', async () => {
    const createModal = new CreateCommunityModal(users.owner.app.driver)
    const isCreateModal = await createModal.element.isDisplayed()
    expect(isCreateModal).toBeTruthy()
    await createModal.typeCommunityName(communityName)
    await createModal.submit()
  })

  it('Owner sees "register username" modal and submits valid username', async () => {
    const registerModal = new RegisterUsernameModal(users.owner.app.driver)
    const isRegisterModal = await registerModal.element.isDisplayed()
    expect(isRegisterModal).toBeTruthy()
    await registerModal.typeUsername(users.owner.username)
    await registerModal.submit()
  })

  it('Owner registers successfully and sees general channel', async () => {
    generalChannelOwner = new Channel(users.owner.app.driver, 'general')
    const isGeneralChannel = await generalChannelOwner.element.isDisplayed()
    const generalChannelText = await generalChannelOwner.element.getText()
    expect(isGeneralChannel).toBeTruthy()
    expect(generalChannelText).toEqual('# general')
  })

  it('Owner sends a message', async () => {
    const isMessageInput = await generalChannelOwner.messageInput.isDisplayed()
    expect(isMessageInput).toBeTruthy()
    await generalChannelOwner.sendMessage(users.owner.messages[0], users.owner.username)
  })

  it('Owner updates their profile photo with JPEG', async () => {
    try {
      console.log('JPEG')
      const menu = new UserProfileContextMenu(users.owner.app.driver)
      await menu.openMenu()
      await menu.openEditProfileMenu()
      await menu.uploadJPEGPhoto()

      const imgSrc = await menu.getProfilePhotoSrc()
      expect(imgSrc).toEqual(EXPECTED_IMG_SRC_JPEG)

      await menu.back(BACK_ARROW_DATA_TESTID.EDIT_PROFILE)
      await menu.back(BACK_ARROW_DATA_TESTID.PROFILE)
    } catch (e) {
      console.error('Failed to set JPEG profile photo', e)
      throw e
    }
  })

  it('Owner updates their profile photo with GIF', async () => {
    try {
      console.log('GIF')
      const menu = new UserProfileContextMenu(users.owner.app.driver)
      await menu.openMenu()
      await menu.openEditProfileMenu()
      await menu.uploadGIFPhoto()

      const imgSrc = await menu.getProfilePhotoSrc()
      expect(imgSrc).toEqual(EXPECTED_IMG_SRC_GIF)

      await menu.back(BACK_ARROW_DATA_TESTID.EDIT_PROFILE)
      await menu.back(BACK_ARROW_DATA_TESTID.PROFILE)
    } catch (e) {
      console.error('Failed to set GIF profile photo', e)
      throw e
    }
  })

  it('Owner updates their profile photo with PNG', async () => {
    try {
      console.log('PNG')
      const menu = new UserProfileContextMenu(users.owner.app.driver)
      await menu.openMenu()
      await menu.openEditProfileMenu()
      await menu.uploadPNGPhoto()

      const imgSrc = await menu.getProfilePhotoSrc()
      expect(imgSrc).toEqual(EXPECTED_IMG_SRC_PNG)

      await menu.back(BACK_ARROW_DATA_TESTID.EDIT_PROFILE)
      await menu.back(BACK_ARROW_DATA_TESTID.PROFILE)
    } catch (e) {
      console.error('Failed to set PNG profile photo', e)
      throw e
    }
  })

  it('Owner opens the settings tab and gets an invitation code', async () => {
    const settingsModal = await new Sidebar(users.owner.app.driver).openSettings()
    const isSettingsModal = await settingsModal.element.isDisplayed()
    expect(isSettingsModal).toBeTruthy()
    await sleep(2000)
    await settingsModal.switchTab('invite') // TODO: Fix - the invite tab should be default for the owner
    await sleep(2000)
    const invitationCodeElement = await settingsModal.invitationCode()
    await sleep(2000)
    invitationCode = await invitationCodeElement.getText()
    await sleep(2000)
    expect(invitationCode).not.toBeUndefined()
    log('Received invitation code:', invitationCode)
    await settingsModal.close()
  })

  it('First user opens the app', async () => {
    await users.user1.app.open()
  })

  it('First user submits invitation code received from owner', async () => {
    const joinCommunityModal = new JoinCommunityModal(users.user1.app.driver)
    const isJoinCommunityModal = await joinCommunityModal.element.isDisplayed()
    expect(isJoinCommunityModal).toBeTruthy()
    await joinCommunityModal.typeCommunityCode(invitationCode)
    await joinCommunityModal.submit()
  })

  it('First user submits valid username', async () => {
    const registerModal = new RegisterUsernameModal(users.user1.app.driver)
    const isRegisterModal = await registerModal.element.isDisplayed()
    expect(isRegisterModal).toBeTruthy()
    await registerModal.clearInput()
    await registerModal.typeUsername(users.user1.username)
    await registerModal.submit()
  })

  it('First user joins successfully sees general channel', async () => {
    generalChannelUser1 = new Channel(users.user1.app.driver, 'general')
    await generalChannelUser1.element.isDisplayed()
    const isMessageInput2 = await generalChannelUser1.messageInput.isDisplayed()
    expect(isMessageInput2).toBeTruthy()
  })

  it("First user sees owner's message with profile photo", async () => {
    const messages = await generalChannelUser1.getAtleastNumUserMessages(users.owner.username, 2)
    const elem = messages?.[1]
    if (!elem) {
      fail('Failed to find at least 2 messages')
    }
    await users.user1.app.driver.wait(until.elementIsVisible(elem))
    const text = await elem.getText()
    expect(text).toEqual(users.owner.messages[0])

    const fullMessages = await generalChannelUser1.getUserMessagesFull(users.owner.username)
    const img = await fullMessages[1].findElement(By.tagName('img'))
    await users.user1.app.driver.wait(until.elementIsVisible(img))
    const imgSrc = await img.getAttribute('src')
    expect(imgSrc).toEqual(EXPECTED_IMG_SRC_PNG)
  })
})

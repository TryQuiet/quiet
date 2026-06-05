import { jest } from '@jest/globals'
import { By, Key, until } from 'selenium-webdriver'

import {
  App,
  Channel,
  CreateCommunityModal,
  JoinCommunityModal,
  JoiningLoadingPanel,
  RegisterUsernameModal,
  ServerOfferModal,
  Sidebar,
  TermsOfServiceModal,
  UsersList,
} from '../selectors'
import { sleep } from '../utils'
import { UserListStatus, UserTestData } from '../types'
import { createLogger } from '../logger'
import { SettingsModalTabName } from '../enums'

const logger = createLogger('leaveCommunityStateLeak:qss')

type LeaveRaceMessages = {
  seededMessages: Record<string, string[]>
}

type LeaveRaceUsers = {
  owner: UserTestData<LeaveRaceMessages>
  joiner: UserTestData<LeaveRaceMessages>
}

type SpamController = {
  stop: () => Promise<number>
}

jest.setTimeout(1200000) // 20 minutes

describe('Leave Community State Leak (QSS)', () => {
  let users: LeaveRaceUsers
  let invitationLink: string
  let spamController: SpamController | undefined

  const oldCommunityName = 'leaveraceold'
  const freshCommunityName = 'leaveracefresh'
  const generalChannelName = 'general'
  const ownerCreatedChannels = ['ownera', 'ownerb']
  const joinerCreatedChannels = ['joinera', 'joinerb']
  const seededChannelNames = [...ownerCreatedChannels, ...joinerCreatedChannels]
  const freshJoinerUsername = 'joinerfresh'
  const leaveReproEnv = {
    QPS_ALLOWED: 'true',
    E2E_ISSUE_3253_REPRO: 'true',
    E2E_ISSUE_3253_LEAVE_REEMIT_DELAY_MS: '1000',
  }

  const stageStartTimes = new Map<string, number>()

  const buildSeededMessages = (username: string): LeaveRaceMessages => ({
    seededMessages: Object.fromEntries(
      seededChannelNames.map(channelName => [
        channelName,
        Array.from({ length: 4 }, (_, index) => `${username}-${channelName}-${index + 1}`),
      ])
    ),
  })

  const waitForJoinedCommunity = async (app: App, username: string): Promise<Channel> => {
    const channel = new Channel(app.driver, generalChannelName)
    logger.info(`Waiting for ${username} to load joined community`)
    expect(await channel.isReady(app.retryConfig.timeoutMs)).toBeTruthy()
    expect(await channel.isOpen(true, true, app.retryConfig.timeoutMs)).toBeTruthy()
    expect(await channel.isMessageInputReady()).toBeTruthy()

    return channel
  }

  const createCommunityWithQss = async (app: App, communityName: string, username: string) => {
    const joinModal = new JoinCommunityModal(app.driver)
    expect(await joinModal.isReady()).toBeTruthy()
    await joinModal.switchToCreateCommunity()

    const createModal = new CreateCommunityModal(app.driver)
    expect(await createModal.isReady()).toBeTruthy()
    await createModal.typeCommunityName(communityName)
    await createModal.submit()

    const serverOfferModal = new ServerOfferModal(app.driver)
    expect(await serverOfferModal.isReady()).toBeTruthy()
    await serverOfferModal.chooseUseServer()

    const registerModal = new RegisterUsernameModal(app.driver)
    expect(await registerModal.isReady()).toBeTruthy()
    await registerModal.clearInput()
    await registerModal.typeUsername(username)
    await registerModal.submit()

    const tosModal = new TermsOfServiceModal(app.driver)
    expect(await tosModal.isReady()).toBeTruthy()
    await tosModal.chooseAgreeAndJoin()

    const joinPanel = new JoiningLoadingPanel(app.driver)
    await joinPanel.waitForJoinToComplete()

    return waitForJoinedCommunity(app, username)
  }

  const joinCommunityWithQss = async (app: App, inviteLink: string, username: string) => {
    const joinModal = new JoinCommunityModal(app.driver)
    expect(await joinModal.isReady()).toBeTruthy()
    await joinModal.typeCommunityInviteLink(inviteLink)
    await joinModal.submit()

    const registerModal = new RegisterUsernameModal(app.driver)
    expect(await registerModal.isReady()).toBeTruthy()
    await registerModal.clearInput()
    await registerModal.typeUsername(username)
    await registerModal.submit()

    const tosModal = new TermsOfServiceModal(app.driver)
    expect(await tosModal.isReady()).toBeTruthy()
    await tosModal.chooseAgreeAndJoin()

    const joinPanel = new JoiningLoadingPanel(app.driver)
    await joinPanel.waitForJoinToComplete()

    return waitForJoinedCommunity(app, username)
  }

  const createChannels = async (app: App, channelNames: string[], expectToggle: boolean = true) => {
    const sidebar = new Sidebar(app.driver)
    for (const channelName of channelNames) {
      const channel = await sidebar.addNewChannel(channelName, true, expectToggle)
      expect(await channel.isReady()).toBeTruthy()
      expect(await channel.isOpen()).toBeTruthy()
      expect(await channel.isMessageInputReady()).toBeTruthy()
    }
  }

  const sendSeededMessages = async (channelName: string) => {
    const ownerChannel = await new Sidebar(users.owner.app.driver).switchChannel(channelName)
    const joinerChannel = await new Sidebar(users.joiner.app.driver).switchChannel(channelName)
    const ownerMessages = users.owner.messages.seededMessages[channelName]
    const joinerMessages = users.joiner.messages.seededMessages[channelName]

    for (const message of ownerMessages) {
      await ownerChannel.sendMessage(message, users.owner.username)
    }

    for (const message of joinerMessages) {
      await joinerChannel.sendMessage(message, users.joiner.username)
    }

    await joinerChannel.getMessageIdsByText(ownerMessages[ownerMessages.length - 1], users.owner.username, 60_000)
    await ownerChannel.getMessageIdsByText(joinerMessages[joinerMessages.length - 1], users.joiner.username, 60_000)
  }

  const startOwnerSpam = async (channelName: string): Promise<SpamController> => {
    const channel = await new Sidebar(users.owner.app.driver).switchChannel(channelName)
    expect(await channel.isMessageInputReady()).toBeTruthy()

    let active = true
    let sent = 0
    let error: unknown

    const task = (async () => {
      const input = await channel.messageInput
      while (active) {
        await input.sendKeys(`owner-spam-${sent + 1}`)
        await input.sendKeys(Key.ENTER)
        sent += 1
        await sleep(100)
      }
    })().catch(e => {
      error = e
      active = false
    })

    return {
      stop: async () => {
        active = false
        await task
        if (error) {
          throw error
        }
        return sent
      },
    }
  }

  const leaveCurrentCommunity = async (app: App) => {
    const settingsModal = await new Sidebar(app.driver).openSettings()
    expect(await settingsModal.isReady()).toBeTruthy()
    await settingsModal.switchTab(SettingsModalTabName.LEAVE_COMMUNITY)
    await settingsModal.leaveCommunityButton(120_000)

    const joinModalHeader = await app.driver.wait(
      until.elementLocated(By.xpath("//h3[text()='Join community']")),
      120_000,
      `Join community modal couldn't be found after leaving community`,
      500
    )
    await app.driver.wait(
      until.elementIsVisible(joinModalHeader),
      120_000,
      `Join community modal wasn't visible after leaving community`,
      500
    )
  }

  const validateFreshCommunity = async () => {
    const sidebar = new Sidebar(users.joiner.app.driver)
    await users.joiner.app.driver.wait(
      async () => {
        const channelNames = await sidebar.getChannelsNames()
        return channelNames.includes(generalChannelName)
      },
      60_000,
      `Fresh community general channel couldn't be found`,
      500
    )
    await users.joiner.app.driver.wait(
      async () => {
        const userNames = await sidebar.getUserNames()
        return userNames.includes(freshJoinerUsername)
      },
      60_000,
      `Fresh community user profile couldn't be found`,
      500
    )

    const generalChannel = new Channel(users.joiner.app.driver, generalChannelName)
    expect(await generalChannel.isReady()).toBeTruthy()
    expect(await generalChannel.isOpen()).toBeTruthy()
    await generalChannel.getMessage('Created #general')
    await sleep(5_000)

    const channelNames = await sidebar.getChannelsNames()
    const userNames = await sidebar.getUserNames()
    const messages = await generalChannel.getAllMessages()
    const messageTexts = await Promise.all(messages.map(async message => message.getText()))
    logger.warn(
      'Fresh community observed state after leave',
      JSON.stringify({ channelNames, userNames, messageTexts }, null, 2)
    )

    expect(channelNames).toEqual([generalChannelName])
    expect(userNames).toEqual([freshJoinerUsername])
    expect(messageTexts).toHaveLength(1)
    expect(messageTexts[0]).toContain('Created #general')
    expect(messageTexts.join('\n')).not.toContain('Deleted #')
  }

  beforeAll(async () => {
    users = {
      owner: {
        username: 'owner',
        messages: buildSeededMessages('owner'),
        app: new App({ username: 'owner' }),
      },
      joiner: {
        username: 'joiner',
        messages: buildSeededMessages('joiner'),
        app: new App({ username: 'joiner', env: leaveReproEnv }),
      },
    }
  })

  afterAll(async () => {
    try {
      await spamController?.stop()
    } catch (error) {
      logger.error('Error stopping owner spam loop:', error)
    }
    for (const user of Object.values(users)) {
      try {
        await user.app.close()
        await user.app.cleanup()
      } catch (error) {
        logger.error(`Error cleaning up user ${user.username}:`, error)
      }
    }
  })

  beforeEach(() => {
    const testName = expect.getState().currentTestName ?? 'unknown'
    logger.info(`░░░ ${testName}`)
    stageStartTimes.set(testName, Date.now())
  })

  afterEach(() => {
    const testName = expect.getState().currentTestName ?? 'unknown'
    const stageStartTime = stageStartTimes.get(testName)
    if (stageStartTime) {
      logger.info(`${testName} Test duration: ${Date.now() - stageStartTime}ms`)
    }
  })

  describe('Stages:', () => {
    it('Owner creates a QSS-backed community and captures an invitation link', async () => {
      await users.owner.app.open(true)
      await createCommunityWithQss(users.owner.app, oldCommunityName, users.owner.username)

      const settingsModal = await new Sidebar(users.owner.app.driver).openSettings()
      expect(await settingsModal.isReady()).toBeTruthy()
      await settingsModal.switchTab(SettingsModalTabName.INVITE)
      const invitationLinkElement = await settingsModal.invitationLink()
      invitationLink = await invitationLinkElement.getText()
      expect(invitationLink).toBeTruthy()
      await settingsModal.closeTabThenModal()
    })

    it('Joiner joins the community', async () => {
      await users.joiner.app.openWithRetries(undefined, true)
      await joinCommunityWithQss(users.joiner.app, invitationLink, users.joiner.username)

      const ownerUserList = new UsersList(users.owner.app.driver)
      await ownerUserList.getUser(users.joiner.username, UserListStatus.ONLINE)
      const joinerUserList = new UsersList(users.joiner.app.driver)
      await joinerUserList.getUser(users.owner.username, UserListStatus.ONLINE)
    })

    it('Owner and joiner each create two public channels', async () => {
      await createChannels(users.owner.app, ownerCreatedChannels)
      await new Sidebar(users.joiner.app.driver).waitForChannels([generalChannelName, ...ownerCreatedChannels])

      await createChannels(users.joiner.app, joinerCreatedChannels, false)
      const allChannelNames = [generalChannelName, ...seededChannelNames]
      await new Sidebar(users.owner.app.driver).waitForChannels(allChannelNames)
      await new Sidebar(users.joiner.app.driver).waitForChannels(allChannelNames)
    })

    it('Owner and joiner each send four messages in every created channel', async () => {
      for (const channelName of seededChannelNames) {
        await sendSeededMessages(channelName)
      }
    })

    it('Joiner leaves while owner continuously spams one channel, then creates and validates a fresh community', async () => {
      spamController = await startOwnerSpam(ownerCreatedChannels[0])

      try {
        await leaveCurrentCommunity(users.joiner.app)
        await createCommunityWithQss(users.joiner.app, freshCommunityName, freshJoinerUsername)
      } finally {
        const sent = await spamController.stop()
        logger.info(`Owner spammed ${sent} messages while joiner left and recreated a community`)
        spamController = undefined
      }

      await validateFreshCommunity()
    })
  })
})

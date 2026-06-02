import { jest } from '@jest/globals'

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
import { SettingsModalTabName } from '../enums'
import { createLogger } from '../logger'
// no direct selenium imports needed – use selectors

const logger = createLogger('oneClient:qss')

jest.setTimeout(900_000) // 15 minutes

describe('One Client (QSS)', () => {
  let app: App
  let generalChannel: Channel

  const generalChannelName = 'general'
  const ownerUserName = 'owner-qss'
  const communityNameAbort = 'on-abort'
  const communityNameAfterCreationAbort = 'after-abort'
  const ownerAfterCreationAbort = 'owner-qss-2'
  const communityNameAfterJoinAbort = 'after-join-abort'
  const ownerAfterJoinAbort = 'owner-qss-3'

  let invitationLink: string

  beforeAll(async () => {
    app = new App({ username: 'owner' })
  })

  afterAll(async () => {
    await app.close()
    await app.cleanup()
  })

  beforeEach(async () => {
    logger.info(`░░░ ${expect.getState().currentTestName}`)
  })

  describe('Abort Creation Midway (at Create Username) >', () => {
    it('Opens app with QSS enabled', async () => {
      await app.open(true)
    })

    it('Navigates to Create Community and submits name', async () => {
      const joinModal = new JoinCommunityModal(app.driver)
      expect(await joinModal.isReady()).toBeTruthy()
      await joinModal.switchToCreateCommunity()

      const createModal = new CreateCommunityModal(app.driver)
      expect(await createModal.isReady()).toBeTruthy()
      await createModal.typeCommunityName(communityNameAbort)
      await createModal.submit()
    })

    it('Shows Server Offer modal (QSS) and accepts it', async () => {
      const serverOffer = new ServerOfferModal(app.driver)
      expect(await serverOffer.isReady()).toBeTruthy()
      await serverOffer.chooseUseServer()
    })

    it('Closes Create Username modal and returns to Join screen', async () => {
      const registerModal = new RegisterUsernameModal(app.driver)
      expect(await registerModal.isReady()).toBeTruthy()

      await registerModal.close()

      const joinModal = new JoinCommunityModal(app.driver)
      expect(await joinModal.isReady()).toBeTruthy()
    })

    describe('Creates a NEW community and username; verifies they are used >', () => {
      it('Switches to Create Community and proceeds', async () => {
        const joinModal = new JoinCommunityModal(app.driver)
        expect(await joinModal.isReady()).toBeTruthy()
        await joinModal.switchToCreateCommunity()
      })

      it('Enters new community name and submits', async () => {
        const createModal = new CreateCommunityModal(app.driver)
        expect(await createModal.isReady()).toBeTruthy()
        await createModal.clearInput()
        await createModal.typeCommunityName(communityNameAfterCreationAbort)
        await createModal.submit()
      })

      it('Accepts server offer', async () => {
        const serverOffer = new ServerOfferModal(app.driver)
        expect(await serverOffer.isReady()).toBeTruthy()
        await serverOffer.chooseUseServer()
      })

      it('Registers new username', async () => {
        const registerModal = new RegisterUsernameModal(app.driver)
        expect(await registerModal.isReady()).toBeTruthy()
        await registerModal.clearInput()
        await registerModal.typeUsername(ownerAfterCreationAbort)
        await registerModal.submit()
      })

      it('Accepts Terms of Service', async () => {
        const tosModal = new TermsOfServiceModal(app.driver)
        expect(await tosModal.isReady()).toBeTruthy()
        await tosModal.chooseAgreeAndJoin()
      })

      it('Waits for join to complete', async () => {
        const joinPanel = new JoiningLoadingPanel(app.driver)
        await joinPanel.waitForJoinToComplete()
      })

      it('Captures invitation link for join-abort scenarios', async () => {
        const sidebar = new Sidebar(app.driver)
        const settingsModal = await sidebar.openSettings()
        expect(await settingsModal.isReady()).toBeTruthy()
        await settingsModal.switchTab(SettingsModalTabName.INVITE)
        const invitationLinkElement = await settingsModal.invitationLink()
        invitationLink = await invitationLinkElement.getText()
        expect(invitationLink).toBeTruthy()
        await settingsModal.closeTabThenModal()
      })

      it('Verifies NEW community name and username are used', async () => {
        generalChannel = new Channel(app.driver, generalChannelName)
        expect(await generalChannel.isReady()).toBeTruthy()
        const commNameRaw = await new Sidebar(app.driver).getDisplayedCommunityName()
        const commName = commNameRaw.trim().toLowerCase()
        expect(commName).toBe(communityNameAfterCreationAbort.toLowerCase())
        expect(commName).not.toBe(communityNameAbort.toLowerCase())

        const sidebar = new Sidebar(app.driver)
        const currentUser = await sidebar.getCurrentUserNickname()
        expect(currentUser.trim().toLowerCase()).toBe(ownerAfterCreationAbort.toLowerCase())
      })
    })

    describe('Abort Join Midway (via invitation link) >', () => {
      it('Leaves community to return to Join screen', async () => {
        const settingsModal = await new Sidebar(app.driver).openSettings()
        expect(await settingsModal.isReady()).toBeTruthy()
        await settingsModal.switchTab(SettingsModalTabName.LEAVE_COMMUNITY)
        await settingsModal.leaveCommunityButton()
      })

      it('Starts join and closes Create Username modal to abort', async () => {
        const joinModal = new JoinCommunityModal(app.driver)
        expect(await joinModal.isReady()).toBeTruthy()
        await joinModal.typeCommunityInviteLink(invitationLink)
        await joinModal.submit()

        const registerModal = new RegisterUsernameModal(app.driver)
        expect(await registerModal.isReady()).toBeTruthy()
        await registerModal.close()

        const joinModalAgain = new JoinCommunityModal(app.driver)
        expect(await joinModalAgain.isReady()).toBeTruthy()
      })

      it('Starts join again, declines Terms of Service to abort', async () => {
        const joinModal = new JoinCommunityModal(app.driver)
        expect(await joinModal.isReady()).toBeTruthy()
        await joinModal.typeCommunityInviteLink(invitationLink)
        await joinModal.submit()

        const registerModal = new RegisterUsernameModal(app.driver)
        expect(await registerModal.isReady()).toBeTruthy()
        await registerModal.clearInput()
        await registerModal.typeUsername('guest-qss')
        await registerModal.submit()

        const tosModal = new TermsOfServiceModal(app.driver)
        expect(await tosModal.isReady()).toBeTruthy()
        await tosModal.chooseAbort()

        const joinModalAgain = new JoinCommunityModal(app.driver)
        expect(await joinModalAgain.isReady()).toBeTruthy()
      })

      describe('Creates a NEW community after aborts; verifies names are from the second run >', () => {
        it('Switches to create community window', async () => {
          const joinModal = new JoinCommunityModal(app.driver)
          expect(await joinModal.isReady()).toBeTruthy()
          await joinModal.switchToCreateCommunity()
        })

        it('Enters the new community name and submits', async () => {
          const createModal = new CreateCommunityModal(app.driver)
          expect(await createModal.isReady()).toBeTruthy()
          await createModal.clearInput()
          await createModal.typeCommunityName(communityNameAfterJoinAbort)
          await createModal.submit()
        })

        it('Enables the server on the server offer page', async () => {
          const serverOffer = new ServerOfferModal(app.driver)
          expect(await serverOffer.isReady()).toBeTruthy()
          await serverOffer.chooseUseServer()
        })

        it('Registers the new username', async () => {
          const registerModal = new RegisterUsernameModal(app.driver)
          expect(await registerModal.isReady()).toBeTruthy()
          await registerModal.clearInput()
          await registerModal.typeUsername(ownerAfterJoinAbort)
          await registerModal.submit()
        })

        it('Accepts the TOS', async () => {
          const tosModal = new TermsOfServiceModal(app.driver)
          expect(await tosModal.isReady()).toBeTruthy()
          await tosModal.chooseAgreeAndJoin()
        })

        it('Waits to join', async () => {
          const joinPanel = new JoiningLoadingPanel(app.driver)
          await joinPanel.waitForJoinToComplete()
        })

        it('Sees the general channel', async () => {
          generalChannel = new Channel(app.driver, generalChannelName)
          expect(await generalChannel.isReady()).toBeTruthy()
        })

        it('Sees the new community name in the sidebar', async () => {
          const commNameRaw = await new Sidebar(app.driver).getDisplayedCommunityName()
          const commName = commNameRaw.trim().toLowerCase()
          expect(commName).toBe(communityNameAfterJoinAbort.toLowerCase())
          expect(commName).not.toBe(communityNameAfterCreationAbort.toLowerCase())
        })

        it('Sees the new username in the sidebar', async () => {
          const sidebar = new Sidebar(app.driver)
          const currentUser = (await sidebar.getCurrentUserNickname()).trim().toLowerCase()
          expect(currentUser).toBe(ownerAfterJoinAbort.toLowerCase())
          expect(currentUser).not.toBe('guest-qss')
        })
      })
    })

    describe('Creation Without Server (Not Now): ToS not shown >', () => {
      const communityNameNoServer = 'qss-noserver'

      it('Resets state', async () => {
        await app.close()
        await app.cleanup(true)
      })

      it('Opens app with QSS enabled', async () => {
        await app.open(true)
      })

      it('Creates community and chooses Not Now on Server Offer', async () => {
        const joinModal = new JoinCommunityModal(app.driver)
        expect(await joinModal.isReady()).toBeTruthy()
        await joinModal.switchToCreateCommunity()

        const createModal = new CreateCommunityModal(app.driver)
        expect(await createModal.isReady()).toBeTruthy()
        await createModal.typeCommunityName(communityNameNoServer)
        await createModal.submit()

        const serverOffer = new ServerOfferModal(app.driver)
        expect(await serverOffer.isReady()).toBeTruthy()
        await serverOffer.chooseNotNow()
      })

      it('Registers username and confirms ToS is NOT shown', async () => {
        const registerModal = new RegisterUsernameModal(app.driver)
        expect(await registerModal.isReady()).toBeTruthy()
        await registerModal.clearInput()
        await registerModal.typeUsername('owner-local')
        await registerModal.submit()

        // Verify ToS modal does NOT appear (short timeout to keep test fast)
        let tosShown = true
        try {
          const tosModal = new TermsOfServiceModal(app.driver)
          await tosModal.isReady(2_000)
          tosShown = true
        } catch (e) {
          tosShown = false
        }
        expect(tosShown).toBe(false)
      })

      it('Joins and sees general channel without ToS', async () => {
        const loadingPanel = new JoiningLoadingPanel(app.driver)
        await loadingPanel.waitForJoinToComplete()

        generalChannel = new Channel(app.driver, generalChannelName)
        expect(await generalChannel.isReady()).toBeTruthy()
        const text = await generalChannel.element.getText()
        expect(text).toEqual(generalChannelName)
      })
    })
  })
})

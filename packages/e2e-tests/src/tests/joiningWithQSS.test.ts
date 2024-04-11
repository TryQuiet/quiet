import { composeInvitationShareUrl, createLibp2pAddress } from '@quiet/common'
import {
  App,
  Channel,
  CreateCommunityModal,
  JoinCommunityModal,
  JoiningLoadingPanel,
  RegisterUsernameModal,
} from '../selectors'
import { InvitationDataV2, InvitationDataVersion } from '@quiet/types'
import { UserTestData } from '../types'

jest.setTimeout(450000)

// Run QSS locally before this test
const serverAddress = 'http://127.0.0.1:3000'
const data: InvitationDataV2 = {
  version: InvitationDataVersion.v2,
  cid: 'QmaRchXhkPWq8iLiMZwFfd2Yi4iESWhAYYJt8cTCVXSwpG',
  token: '898989',
  serverAddress: serverAddress,
  inviterAddress: 'pgzlcstu4ljvma7jqyalimcxlvss5bwlbba3c3iszgtwxee4qjdlgeqd',
}

const invitationCode = decodeURIComponent(composeInvitationShareUrl(data))

describe('User joining with storage server', () => {
  let users: Record<string, UserTestData>
  const communityName = 'Filmmakers'
  let generalChannelOwner: Channel

  beforeAll(async () => {
    users = {
      owner: {
        username: 'owner',
        messages: ['Hi'],
        app: new App(),
      },
      user1: {
        username: 'user-joining-1',
        messages: ['Nice to meet you all'],
        app: new App(),
      },
    }
  })

  afterAll(async () => {
    await users.owner.app.close()
    await users.user1.app.close()
  })

  describe.skip('Owner creates the community', () => {
    // Skip, at this moment we can't fully connect without having access to owner's link
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
  })

  describe('Guest joins using v2 invitation link', () => {
    it('Guest opens the app', async () => {
      await users.user1.app.open()
    })
    it('Guest submits invitation code received from owner', async () => {
      const joinCommunityModal = new JoinCommunityModal(users.user1.app.driver)
      const isJoinCommunityModal = await joinCommunityModal.element.isDisplayed()
      expect(isJoinCommunityModal).toBeTruthy()
      console.log({ invitationCode })
      await joinCommunityModal.typeCommunityCode(invitationCode)
      await joinCommunityModal.submit()
    })

    it('Guest submits valid username', async () => {
      const registerModal = new RegisterUsernameModal(users.user1.app.driver)
      const isRegisterModal = await registerModal.element.isDisplayed()
      expect(isRegisterModal).toBeTruthy()
      await registerModal.clearInput()
      await registerModal.typeUsername(users.user1.username)
      await registerModal.submit()
    })

    it('Guest sees the joining panel', async () => {
      // TODO: finish joining process after implementing retrieving/displaying v2 invitation link
      const joiningPanel = new JoiningLoadingPanel(users.user1.app.driver)
      await joiningPanel.element.isDisplayed()
    })
  })
})

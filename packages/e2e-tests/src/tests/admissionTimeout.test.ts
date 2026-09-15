import { jest } from '@jest/globals'
import { By } from 'selenium-webdriver'
import { composeInvitationShareUrl, parseInvitationLink } from '@quiet/common'
import {
  App,
  Channel,
  CreateCommunityModal,
  JoinCommunityModal,
  JoiningLoadingPanel,
  RegisterUsernameModal,
  Sidebar,
} from '../selectors'
import { SettingsModalTabName } from '../enums'
import { createLogger } from '../logger'

const logger = createLogger('admissionTimeout')
const previousAdmissionTimeout = process.env.INVITATION_ADMISSION_TIMEOUT_MS
const previousLocalTransport = process.env.LOCAL_TRANSPORT

jest.setTimeout(180_000)

describe('Timed-out P2P admission recovery', () => {
  const apps: App[] = []

  beforeAll(() => {
    process.env.LOCAL_TRANSPORT = 'true'
    process.env.INVITATION_ADMISSION_TIMEOUT_MS = '10000'
  })

  afterAll(async () => {
    for (const app of [...apps].reverse()) {
      try {
        await app.close()
        await app.cleanup()
      } catch (error) {
        logger.error(`Failed to clean up ${app.name}`, error)
      }
    }
    if (previousLocalTransport == null) delete process.env.LOCAL_TRANSPORT
    else process.env.LOCAL_TRANSPORT = previousLocalTransport
    if (previousAdmissionTimeout == null) delete process.env.INVITATION_ADMISSION_TIMEOUT_MS
    else process.env.INVITATION_ADMISSION_TIMEOUT_MS = previousAdmissionTimeout
  })

  async function createCommunityAndGetInvitation(
    owner: App,
    ownerUsername: string,
    invitationTab: SettingsModalTabName,
    getInvitation: (settings: Awaited<ReturnType<Sidebar['openSettings']>>) => Promise<string>
  ): Promise<string> {
    const communityName = `timeout${Date.now().toString(36)}`

    await owner.openWithRetries()
    const ownerJoinModal = new JoinCommunityModal(owner.driver)
    expect(await ownerJoinModal.isReady()).toBeTruthy()
    await ownerJoinModal.switchToCreateCommunity()

    const createModal = new CreateCommunityModal(owner.driver)
    expect(await createModal.isReady()).toBeTruthy()
    await createModal.typeCommunityName(communityName)
    await createModal.submit()

    const ownerRegistration = new RegisterUsernameModal(owner.driver)
    expect(await ownerRegistration.isReady()).toBeTruthy()
    await ownerRegistration.typeUsername(ownerUsername)
    await ownerRegistration.submit()
    await new JoiningLoadingPanel(owner.driver).waitForJoinToComplete(15_000, 60_000)
    expect(await new Channel(owner.driver, 'general').isReady()).toBeTruthy()

    const settings = await new Sidebar(owner.driver).openSettings()
    expect(await settings.isReady()).toBeTruthy()
    await settings.switchTab(invitationTab)
    const invitation = await getInvitation(settings)
    await settings.closeTabThenModal()
    return invitation
  }

  async function expectJoinCommunityError(app: App, message: string, inputValue = ''): Promise<void> {
    expect(await new JoinCommunityModal(app.driver).isReady(30_000)).toBeTruthy()
    expect(await app.driver.findElement(By.xpath(`//*[contains(text(), '${message}')]`)).isDisplayed()).toBeTruthy()
    const inviteInput = await app.driver.findElement(By.xpath('//input[@placeholder="Invite link"]'))
    expect(await inviteInput.getAttribute('value')).toBe(inputValue)
  }

  async function expectJoiningPanelHidden(app: App): Promise<void> {
    const panels = await app.driver.findElements(By.xpath('//div[@data-testid="joiningPanelComponent"]'))
    const visiblePanels = await Promise.all(panels.map(async panel => await panel.isDisplayed()))
    expect(visiblePanels.some(Boolean)).toBe(false)
  }

  function makeInvalidInvitationLink(invitationLink: string): string {
    const invitation = parseInvitationLink(new URL(invitationLink).hash.slice(1))
    return composeInvitationShareUrl({
      ...invitation,
      authData: {
        ...invitation.authData,
        seed: '1111111111111111',
      },
    } as typeof invitation)
  }

  it('keeps the guest on Join Community when an invalid invitation is submitted', async () => {
    const guest = new App({ username: 'invalidguest' })
    apps.push(guest)

    await guest.openWithRetries()
    const guestJoinModal = new JoinCommunityModal(guest.driver)
    expect(await guestJoinModal.isReady()).toBeTruthy()
    await guestJoinModal.typeCommunityInviteLink('invalid-invite')
    await guestJoinModal.submit()

    await expectJoinCommunityError(guest, 'Please check your invitation code and try again', 'invalid-invite')
  })

  it('has another peer reject a well-formed invitation with an invalid proof', async () => {
    const owner = new App({ username: 'rejectowner' })
    const guest = new App({ username: 'rejectguest' })
    apps.push(owner, guest)

    const invitationLink = await createCommunityAndGetInvitation(
      owner,
      'rejectowner',
      SettingsModalTabName.INVITE,
      async settings => await (await settings.invitationLink()).getText()
    )
    const invalidInvitationLink = makeInvalidInvitationLink(invitationLink)
    owner.buildSetup.clearProcessOutput()

    await guest.openWithRetries()
    const joinModal = new JoinCommunityModal(guest.driver)
    expect(await joinModal.isReady()).toBeTruthy()
    await joinModal.typeCommunityInviteLink(invalidInvitationLink)
    await joinModal.submit()

    const registration = new RegisterUsernameModal(guest.driver)
    expect(await registration.isReady()).toBeTruthy()
    await registration.typeUsername('rejectguest')
    await registration.submit()
    expect(await new JoiningLoadingPanel(guest.driver).waitUntilVisible(15_000)).toBeTruthy()

    await owner.buildSetup.waitForProcessOutput('INVITATION_PROOF_INVALID', 30_000)
  })

  it('returns a joining peer to Join Community after reopening during admission', async () => {
    const owner = new App({ username: 'reopenowner' })
    const joiningPeer = new App({ username: 'reopenpeer' })
    apps.push(owner, joiningPeer)

    const invitationLink = await createCommunityAndGetInvitation(
      owner,
      'reopenowner',
      SettingsModalTabName.INVITE,
      async settings => await (await settings.invitationLink()).getText()
    )

    // Keep the peer in the joining state without allowing admission to complete.
    await owner.close()
    await joiningPeer.openWithRetries()
    const joinModal = new JoinCommunityModal(joiningPeer.driver)
    expect(await joinModal.isReady()).toBeTruthy()
    await joinModal.typeCommunityInviteLink(invitationLink)
    await joinModal.submit()

    const registration = new RegisterUsernameModal(joiningPeer.driver)
    expect(await registration.isReady()).toBeTruthy()
    await registration.typeUsername('reopenpeer')
    await registration.submit()
    expect(await new JoiningLoadingPanel(joiningPeer.driver).waitUntilVisible(15_000)).toBeTruthy()

    await joiningPeer.close()
    await joiningPeer.openWithRetries()

    expect(await new JoinCommunityModal(joiningPeer.driver).isReady(30_000)).toBeTruthy()
    await expectJoiningPanelHidden(joiningPeer)
  })

  it('clears a timed-out member invitation and returns the guest to Join Community', async () => {
    const owner = new App({ username: 'memberowner' })
    const guest = new App({ username: 'memberguest' })
    apps.push(owner, guest)

    const ownerUsername = 'memberowner'
    const guestUsername = 'memberguest'
    const invitationLink = await createCommunityAndGetInvitation(
      owner,
      ownerUsername,
      SettingsModalTabName.INVITE,
      async settings => await (await settings.invitationLink()).getText()
    )

    // The invite still identifies the owner, but no peer is online to admit the guest.
    await owner.close()
    await guest.openWithRetries()
    const guestJoinModal = new JoinCommunityModal(guest.driver)
    expect(await guestJoinModal.isReady()).toBeTruthy()
    await guestJoinModal.typeCommunityInviteLink(invitationLink)
    await guestJoinModal.submit()

    const guestRegistration = new RegisterUsernameModal(guest.driver)
    expect(await guestRegistration.isReady()).toBeTruthy()
    await guestRegistration.typeUsername(guestUsername)
    await guestRegistration.submit()
    expect(await new JoiningLoadingPanel(guest.driver).waitUntilVisible(15_000)).toBeTruthy()

    await expectJoinCommunityError(guest, 'try again when other peers are online')
  })

  it('clears a timed-out device invitation and returns the linked device to Join Community', async () => {
    const owner = new App({ username: 'deviceowner' })
    const linkedDevice = new App({ username: 'linkeddevice' })
    apps.push(owner, linkedDevice)

    const deviceInvitationLink = await createCommunityAndGetInvitation(
      owner,
      'deviceowner',
      SettingsModalTabName.LINKED_DEVICES,
      async settings => await (await settings.deviceLink()).getText()
    )

    // The invite identifies the owner device, but no peer is online to admit the linked device.
    await owner.close()
    await linkedDevice.openWithRetries()
    const joinModal = new JoinCommunityModal(linkedDevice.driver)
    expect(await joinModal.isReady()).toBeTruthy()
    await joinModal.typeCommunityInviteLink(deviceInvitationLink)
    await joinModal.submit()

    expect(await new JoiningLoadingPanel(linkedDevice.driver).waitUntilVisible(15_000)).toBeTruthy()
    await expectJoinCommunityError(linkedDevice, 'make sure both devices have the app open')

    // A transport becoming available after reset must not revive the cleared
    // admission. A newly submitted device link is allowed to start a new one.
    await owner.openWithRetries()
    expect(await new JoinCommunityModal(linkedDevice.driver).isReady()).toBeTruthy()
    await expectJoiningPanelHidden(linkedDevice)

    const settings = await new Sidebar(owner.driver).openSettings()
    expect(await settings.isReady()).toBeTruthy()
    await settings.switchTab(SettingsModalTabName.LINKED_DEVICES)
    const freshDeviceInvitationLink = await (await settings.deviceLink()).getText()
    await settings.closeTabThenModal()

    const resetJoinModal = new JoinCommunityModal(linkedDevice.driver)
    await resetJoinModal.typeCommunityInviteLink(freshDeviceInvitationLink)
    await resetJoinModal.submit()
    await new JoiningLoadingPanel(linkedDevice.driver).waitForJoinToComplete(15_000, 60_000)
    expect(await new Channel(linkedDevice.driver, 'general').isReady()).toBeTruthy()
  })
})

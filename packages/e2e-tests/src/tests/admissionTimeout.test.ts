import { jest } from '@jest/globals'
import { By } from 'selenium-webdriver'
import { composeInvitationShareUrl, parseInvitationLink } from '@quiet/common'
import { InvitationDataVersion, type DeviceInvitationDataV5 } from '@quiet/types'
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
import { unavailableQssEndpoint } from '../unavailableQssEndpoint'

const logger = createLogger('admissionTimeout')
const previousAdmissionTimeout = process.env.INVITATION_ADMISSION_TIMEOUT_MS
const previousLocalTransport = process.env.LOCAL_TRANSPORT

// This suite exercises admission and recovery over actual local libp2p sockets.
// Public Tor bootstrap and descriptor publication are covered separately.
const JOIN_COMPLETION_TIMEOUT_MS = 60_000
const PANEL_VISIBLE_TIMEOUT_MS = 15_000
const PEER_DIAL_TIMEOUT_MS = 30_000

// The joining panel also clears when admission is RESET, so a wait on the panel
// alone reports success and the run only fails later on a missing channel. The
// backend names the reset, so check for it before trusting a cleared panel.
function assertAdmissionNotReset(app: App): void {
  for (const marker of ['Admission acquisition deadline expired', 'Emitting event: resetAdmission']) {
    if (app.buildSetup.hasProcessOutput(marker)) {
      throw new Error(
        `${app.name} reset admission instead of completing it ("${marker}"); ` +
          `the joining panel cleared because the join was abandoned, not because it succeeded`
      )
    }
  }
}

jest.setTimeout(300_000)

describe('Timed-out P2P admission recovery', () => {
  const apps: App[] = []

  beforeAll(() => {
    process.env.LOCAL_TRANSPORT = 'true'
    process.env.INVITATION_ADMISSION_TIMEOUT_MS = '10000'
  })

  // Release each test's apps as soon as that test is done with them.
  async function releaseApps(...toRelease: App[]): Promise<void> {
    for (const app of [...toRelease].reverse()) {
      const index = apps.indexOf(app)
      if (index !== -1) apps.splice(index, 1)
      try {
        await app.close()
      } catch (error) {
        logger.error(`Failed to close ${app.name}`, error)
      }
      // cleanup() refuses to run while the app is open, so a failed close must
      // not skip it silently.
      try {
        await app.cleanup()
      } catch (error) {
        logger.error(`Failed to clean up ${app.name}`, error)
      }
    }
  }

  afterAll(async () => {
    await releaseApps(...apps)
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
    await new JoiningLoadingPanel(owner.driver).waitForJoinToComplete(
      PANEL_VISIBLE_TIMEOUT_MS,
      JOIN_COMPLETION_TIMEOUT_MS,
      `${ownerUsername} community creation`
    )
    expect(await new Channel(owner.driver, 'general').isReady()).toBeTruthy()

    const settings = await new Sidebar(owner.driver).openSettings()
    expect(await settings.isReady()).toBeTruthy()
    await settings.switchTab(invitationTab)
    const invitation = await getInvitation(settings)
    await settings.closeTabThenModal()
    return invitation
  }

  async function getReusableDeviceInvitation(owner: App, previousInvitation: string): Promise<string> {
    const settings = await new Sidebar(owner.driver).openSettings()
    expect(await settings.isReady()).toBeTruthy()
    await settings.switchTab(SettingsModalTabName.LINKED_DEVICES)
    const linkElement = await settings.deviceLink()
    const invitation = await owner.driver.wait<string>(
      async () => {
        const candidate = await linkElement.getText()
        return /^(https?|quiet):\/\//.test(candidate) ? candidate : null
      },
      30_000,
      'The device invitation was not revealed'
    )
    // Bootstrap addresses may change as peers connect, but reopening must keep
    // the same unexpired admission credential.
    expect(parseInvitationLink(new URL(invitation).hash.slice(1)).authData.seed).toBe(
      parseInvitationLink(new URL(previousInvitation).hash.slice(1)).authData.seed
    )
    await settings.closeTabThenModal()
    return invitation
  }

  async function expectJoinCommunityError(
    app: App,
    message: string,
    inputValue = '',
    timeoutMs = 30_000
  ): Promise<void> {
    expect(await new JoinCommunityModal(app.driver).isReady(timeoutMs)).toBeTruthy()
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

  function withUnavailableQss(invitationLink: string, qssEndpoint: string): string {
    const invitation = parseInvitationLink(new URL(invitationLink).hash.slice(1))
    return composeInvitationShareUrl({
      ...invitation,
      version: InvitationDataVersion.v5,
      qssEnabled: true,
      qssEndpoint,
    } as DeviceInvitationDataV5)
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

    await releaseApps(guest)
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

    await releaseApps(owner, guest)
  })

  it('allows a valid device link after an invalid device admission', async () => {
    const suiteAdmissionTimeout = process.env.INVITATION_ADMISSION_TIMEOUT_MS
    // Recovery must allow a dropped first dial and the queued retry (8 seconds
    // after that failure). The suite's 10-second expiry budget cannot cover both.
    // Set this before launch: both attempts use the same backend process.
    process.env.INVITATION_ADMISSION_TIMEOUT_MS = String(JOIN_COMPLETION_TIMEOUT_MS)
    const owner = new App({ username: 'invaliddeviceowner' })
    const linkedDevice = new App({ username: 'invalidlinkeddevice' })
    apps.push(owner, linkedDevice)

    try {
      const deviceInvitationLink = await createCommunityAndGetInvitation(
        owner,
        'invaliddeviceowner',
        SettingsModalTabName.LINKED_DEVICES,
        async settings => await (await settings.deviceLink()).getText()
      )
      const invalidDeviceInvitationLink = makeInvalidInvitationLink(deviceInvitationLink)

      await linkedDevice.openWithRetries()
      const joinModal = new JoinCommunityModal(linkedDevice.driver)
      expect(await joinModal.isReady()).toBeTruthy()
      await joinModal.typeCommunityInviteLink(invalidDeviceInvitationLink)
      await joinModal.submit()
      expect(await new JoiningLoadingPanel(linkedDevice.driver).waitUntilVisible(15_000)).toBeTruthy()

      // The preceding test covers peer-side invalid-proof rejection. Here the
      // bounded admission timeout must clear provisional state whether the invalid
      // proof is rejected or the first local dial is lost before reaching the owner.
      await expectJoinCommunityError(
        linkedDevice,
        'make sure both devices have the app open',
        '',
        JOIN_COMPLETION_TIMEOUT_MS + 30_000
      )

      // Reopening reuses the owner's unexpired link. This valid seed differs from
      // the rejected proof and must work without restarting the target backend.
      const freshDeviceInvitationLink = await getReusableDeviceInvitation(owner, deviceInvitationLink)
      const resetJoinModal = new JoinCommunityModal(linkedDevice.driver)
      linkedDevice.buildSetup.clearProcessOutput()
      await resetJoinModal.typeCommunityInviteLink(freshDeviceInvitationLink)
      await resetJoinModal.submit()
      await new JoiningLoadingPanel(linkedDevice.driver).waitForJoinToComplete(
        PANEL_VISIBLE_TIMEOUT_MS,
        JOIN_COMPLETION_TIMEOUT_MS,
        'device link after invalid admission'
      )
      assertAdmissionNotReset(linkedDevice)
      expect(await new Channel(linkedDevice.driver, 'general').isReady()).toBeTruthy()
    } finally {
      process.env.INVITATION_ADMISSION_TIMEOUT_MS = suiteAdmissionTimeout
      await releaseApps(owner, linkedDevice)
    }
  })

  it('can join again after reopening during interrupted admission', async () => {
    const owner = new App({ username: 'reopenowner' })
    const joiningPeer = new App({ username: 'reopenpeer' })
    apps.push(owner, joiningPeer)

    const suiteAdmissionTimeout = process.env.INVITATION_ADMISSION_TIMEOUT_MS
    // This case proves successful recovery, not the short expiry deadline.
    process.env.INVITATION_ADMISSION_TIMEOUT_MS = String(JOIN_COMPLETION_TIMEOUT_MS)
    try {
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

      const retryJoinModal = new JoinCommunityModal(joiningPeer.driver)
      expect(await retryJoinModal.isReady(30_000)).toBeTruthy()

      // isDisplayed() also returns true for a joining panel behind this modal.
      // Prove recovery through real input/clicks and completed admission instead.
      await owner.openWithRetries()
      expect(await new Channel(owner.driver, 'general').isReady()).toBeTruthy()
      const settings = await new Sidebar(owner.driver).openSettings()
      expect(await settings.isReady()).toBeTruthy()
      await settings.switchTab(SettingsModalTabName.INVITE)
      // Restarting the owner can change its local transport address.
      const freshInvitation = await (await settings.invitationLink()).getText()
      await settings.closeTabThenModal()

      joiningPeer.buildSetup.clearProcessOutput()
      await retryJoinModal.typeCommunityInviteLink(freshInvitation)
      await retryJoinModal.submit()
      const retryRegistration = new RegisterUsernameModal(joiningPeer.driver)
      expect(await retryRegistration.isReady()).toBeTruthy()
      await retryRegistration.typeUsername('recoveredpeer')
      await retryRegistration.submit()
      await new JoiningLoadingPanel(joiningPeer.driver).waitForJoinToComplete(
        PANEL_VISIBLE_TIMEOUT_MS,
        JOIN_COMPLETION_TIMEOUT_MS,
        'community join after interrupted admission'
      )
      assertAdmissionNotReset(joiningPeer)
      expect(await new Channel(joiningPeer.driver, 'general').isReady()).toBeTruthy()
    } finally {
      await releaseApps(owner, joiningPeer)
      if (suiteAdmissionTimeout == null) delete process.env.INVITATION_ADMISSION_TIMEOUT_MS
      else process.env.INVITATION_ADMISSION_TIMEOUT_MS = suiteAdmissionTimeout
    }
  })

  it('links a device after reopening the target during an interrupted admission', async () => {
    // Keep this endpoint reserved: localhost:3003 may host a real local QSS
    // server, whose admission rejection does not exercise transport fallback.
    const unavailableQss = await unavailableQssEndpoint()
    const suiteAdmissionTimeout = process.env.INVITATION_ADMISSION_TIMEOUT_MS
    // This case interrupts admission by closing the app. Keep the production
    // deadline; the other cases deliberately shorten it to exercise expiry.
    delete process.env.INVITATION_ADMISSION_TIMEOUT_MS
    const testApps: App[] = []
    try {
      const owner = new App({ username: 'reopendeviceowner' })
      apps.push(owner)
      testApps.push(owner)

      const p2pDeviceInvitationLink = await createCommunityAndGetInvitation(
        owner,
        'reopendeviceowner',
        SettingsModalTabName.LINKED_DEVICES,
        async settings => await (await settings.deviceLink()).getText()
      )
      const deviceInvitationLink = withUnavailableQss(p2pDeviceInvitationLink, unavailableQss.url)

      // An offline inviter makes the pending state deterministic even on a fast
      // machine. Neither Tor latency nor polling a log line can prevent a join
      // from racing the close when the inviter remains online.
      await owner.close()
      // Also the app's own QSS_ENDPOINT, which otherwise defaults to port 3003.
      const linkedDevice = new App({ username: 'reopenedlinkeddevice', qssEndpoint: unavailableQss.url })
      apps.push(linkedDevice)
      testApps.push(linkedDevice)
      await linkedDevice.openWithRetries(undefined, true)
      const joinModal = new JoinCommunityModal(linkedDevice.driver)
      expect(await joinModal.isReady()).toBeTruthy()
      await joinModal.typeCommunityInviteLink(deviceInvitationLink)
      await joinModal.submit()
      expect(
        await new JoiningLoadingPanel(linkedDevice.driver).waitUntilVisible(
          PANEL_VISIBLE_TIMEOUT_MS,
          'interrupted device admission'
        )
      ).toBeTruthy()
      // Dialing begins after the provisional community and admission transport
      // are stored. The owner is offline, so this attempt cannot commit admission.
      await linkedDevice.buildSetup.waitForProcessOutput('Dialing peer address:', PEER_DIAL_TIMEOUT_MS)
      expect(unavailableQss.connectionCount).toBeGreaterThan(0)
      assertAdmissionNotReset(linkedDevice)

      await linkedDevice.close()
      linkedDevice.buildSetup.clearProcessOutput()
      await linkedDevice.openWithRetries(undefined, true)
      expect(await new JoinCommunityModal(linkedDevice.driver).isReady(30_000)).toBeTruthy()
      await expectJoiningPanelHidden(linkedDevice)

      await owner.openWithRetries()
      const ownerChannel = new Channel(owner.driver, 'general')
      expect(await ownerChannel.isReady()).toBeTruthy()
      const qssAttemptsBeforeRetry = unavailableQss.connectionCount
      linkedDevice.buildSetup.clearProcessOutput()
      const retryJoinModal = new JoinCommunityModal(linkedDevice.driver)
      await retryJoinModal.typeCommunityInviteLink(deviceInvitationLink)
      await retryJoinModal.submit()
      await linkedDevice.buildSetup.waitForProcessOutput('Dialing peer address:', PEER_DIAL_TIMEOUT_MS)
      await new JoiningLoadingPanel(linkedDevice.driver).waitForJoinToComplete(
        PANEL_VISIBLE_TIMEOUT_MS,
        JOIN_COMPLETION_TIMEOUT_MS,
        'device link retry after interrupted admission'
      )
      expect(unavailableQss.connectionCount).toBeGreaterThan(qssAttemptsBeforeRetry)
      assertAdmissionNotReset(linkedDevice)
      const linkedChannel = new Channel(linkedDevice.driver, 'general')
      expect(await linkedChannel.isReady()).toBeTruthy()
      expect((await new Sidebar(linkedDevice.driver).getCurrentUserNickname()).trim()).toBe('reopendeviceowner')

      await linkedChannel.sendMessage('Linked after interrupted admission', 'reopendeviceowner')
      expect(await ownerChannel.getMessage('Linked after interrupted admission')).toBeTruthy()
      await ownerChannel.sendMessage('Owner confirms the recovered device', 'reopendeviceowner')
      expect(await linkedChannel.getMessage('Owner confirms the recovered device')).toBeTruthy()
    } finally {
      await releaseApps(...testApps)
      try {
        await unavailableQss.close()
      } finally {
        if (suiteAdmissionTimeout == null) delete process.env.INVITATION_ADMISSION_TIMEOUT_MS
        else process.env.INVITATION_ADMISSION_TIMEOUT_MS = suiteAdmissionTimeout
      }
    }
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

    await releaseApps(owner, guest)
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
    await new JoiningLoadingPanel(linkedDevice.driver).waitForJoinToComplete(
      PANEL_VISIBLE_TIMEOUT_MS,
      JOIN_COMPLETION_TIMEOUT_MS,
      'device link after timed-out invitation'
    )
    expect(await new Channel(linkedDevice.driver, 'general').isReady()).toBeTruthy()

    await releaseApps(owner, linkedDevice)
  })
})

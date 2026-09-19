import { jest } from '@jest/globals'
import { By } from 'selenium-webdriver'
import { composeInvitationShareUrl, parseInvitationLink } from '@quiet/common'
import { SettingsModalTabName } from '../enums'
import {
  App,
  Channel,
  CreateCommunityModal,
  JoinCommunityModal,
  JoiningLoadingPanel,
  RegisterUsernameModal,
  Sidebar,
} from '../selectors'

// Opt-in investigation of #3590 against real packaged desktop clients. Preserve
// the production retry behavior; only the existing E2E deadline is configurable.
const diagnostic = process.env.REPRO_3590 === 'true' ? describe : describe.skip
const admissionTimeoutMs = Number(process.env.REPRO_ADMISSION_TIMEOUT_MS ?? 10_000)
jest.setTimeout(300_000)

diagnostic('Admission recovery diagnostic #3590', () => {
  const apps: App[] = []

  afterAll(async () => {
    for (const app of [...apps].reverse()) {
      await app.close()
      await app.cleanup()
    }
  })

  it('links with the original valid invitation after rejecting an invalid proof in the same apps', async () => {
    const environment = {
      LOCAL_TRANSPORT: 'true',
      NETWORK_LOGGING: 'true',
      INVITATION_ADMISSION_TIMEOUT_MS: String(admissionTimeoutMs),
    }
    const owner = new App({ username: 'diag3590owner', environment })
    const joiner = new App({ username: 'diag3590joiner', environment })
    apps.push(owner, joiner)

    await owner.openWithRetries()
    const ownerJoin = new JoinCommunityModal(owner.driver)
    expect(await ownerJoin.isReady()).toBe(true)
    await ownerJoin.switchToCreateCommunity()
    const create = new CreateCommunityModal(owner.driver)
    expect(await create.isReady()).toBe(true)
    await create.typeCommunityName(`diag3590${Date.now().toString(36)}`)
    await create.submit()
    const registration = new RegisterUsernameModal(owner.driver)
    expect(await registration.isReady()).toBe(true)
    await registration.typeUsername('diag3590owner')
    await registration.submit()
    await new JoiningLoadingPanel(owner.driver).waitForJoinToComplete(15_000, 60_000)
    expect(await new Channel(owner.driver, 'general').isReady()).toBe(true)

    const settings = await new Sidebar(owner.driver).openSettings()
    expect(await settings.isReady()).toBe(true)
    await settings.switchTab(SettingsModalTabName.LINKED_DEVICES)
    const validInvitationLink = await (await settings.deviceLink()).getText()
    const invitation = parseInvitationLink(new URL(validInvitationLink).hash.slice(1))
    const invalidInvitationLink = composeInvitationShareUrl({
      ...invitation,
      authData: { ...invitation.authData, seed: '1111111111111111' },
    } as typeof invitation)
    // Leave this drawer open: reopening/closing it is a separate UI behavior.
    // Both submissions target the same owner, credential and endpoint.
    owner.buildSetup.clearProcessOutput()

    await joiner.openWithRetries()
    const join = new JoinCommunityModal(joiner.driver)
    expect(await join.isReady()).toBe(true)
    await join.typeCommunityInviteLink(invalidInvitationLink)
    console.info('DIAG3590 invalid submission', new Date().toISOString(), { admissionTimeoutMs })
    await join.submit()
    await owner.buildSetup.waitForProcessOutput('INVITATION_PROOF_INVALID', 30_000)
    expect(await new JoinCommunityModal(joiner.driver).isReady(admissionTimeoutMs + 30_000)).toBe(true)
    expect(
      await joiner.driver
        .findElement(By.xpath("//*[contains(text(), 'make sure both devices have the app open')]"))
        .isDisplayed()
    ).toBe(true)
    console.info('DIAG3590 first reset observed', new Date().toISOString())

    joiner.buildSetup.clearProcessOutput()
    const retry = new JoinCommunityModal(joiner.driver)
    await retry.typeCommunityInviteLink(validInvitationLink)
    console.info('DIAG3590 valid submission', new Date().toISOString())
    await retry.submit()
    await new JoiningLoadingPanel(joiner.driver).waitForJoinToComplete(15_000, admissionTimeoutMs + 30_000)
    if (joiner.buildSetup.hasProcessOutput('Emitting event: resetAdmission')) {
      throw new Error(`DIAG3590: valid invitation reset within the ${admissionTimeoutMs}ms admission budget`)
    }
    expect(await new Channel(joiner.driver, 'general').isReady()).toBe(true)
    console.info('DIAG3590 valid admission succeeded', new Date().toISOString())
  })
})

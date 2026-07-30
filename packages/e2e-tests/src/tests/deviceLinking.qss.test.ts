import { jest } from '@jest/globals'
import { composeInvitationShareUrl, parseInvitationLink } from '@quiet/common'
import { InvitationDataVersion, isDeviceInvitationData } from '@quiet/types'
import type { ChildProcess } from 'child_process'
import getPort from 'get-port'
import { connect, createServer, type Socket } from 'net'

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
} from '../selectors'
import { SettingsModalTabName } from '../enums'
import { createLogger } from '../logger'
import type { UserTestData } from '../types'
import { sleep, tailQssLogs } from '../utils'

type PrimaryMessages = {
  fromPrimaryDevice: string
  fromLinkedDevice: string
}

type MemberMessages = {
  afterJoining: string
}

type DeviceLinkingUsers = {
  primary: UserTestData<PrimaryMessages>
  linkedDevice: {
    app: App
  }
  member: UserTestData<MemberMessages>
}

const logger = createLogger('deviceLinking:qss')
const QSS_HOST = '127.0.0.1'
const QSS_PORT = 3003
jest.setTimeout(1_200_000) // 20 minutes

async function startQssProxy() {
  const port = await getPort()
  const sockets = new Set<Socket>()
  const server = createServer(client => {
    const upstream = connect(QSS_PORT, QSS_HOST)
    sockets.add(client)
    sockets.add(upstream)

    const closePair = (): void => {
      client.destroy()
      upstream.destroy()
      sockets.delete(client)
      sockets.delete(upstream)
    }
    client.once('error', closePair)
    upstream.once('error', closePair)
    client.once('close', closePair)
    upstream.once('close', closePair)
    client.pipe(upstream)
    upstream.pipe(client)
  })

  await new Promise<void>((resolve, reject) => {
    server.once('error', reject)
    server.listen(port, QSS_HOST, () => {
      server.off('error', reject)
      resolve()
    })
  })

  let stopped = false
  return {
    endpoint: `ws://${QSS_HOST}:${port}`,
    stop: async (): Promise<void> => {
      if (stopped) return
      stopped = true
      for (const socket of sockets) {
        socket.destroy()
      }
      sockets.clear()
      await new Promise<void>((resolve, reject) => {
        server.close(error => {
          if (error != null) {
            reject(error)
            return
          }
          resolve()
        })
      })
    },
  }
}

function parseShareInvitation(link: string) {
  const fragment = new URL(link).hash.slice(1)
  if (fragment.length === 0) {
    throw new Error(`Invitation link has no fragment: ${link}`)
  }
  return parseInvitationLink(fragment)
}

function routeMemberInviteThroughProxy(link: string, qssEndpoint: string): string {
  const invite = parseShareInvitation(link)
  if (invite.version !== InvitationDataVersion.v5 || isDeviceInvitationData(invite)) {
    throw new Error('Expected a QSS member invitation')
  }
  return composeInvitationShareUrl({ ...invite, qssEndpoint })
}

function makeP2pOnlyDeviceInvite(link: string, ownerPeerId: string, unawarePeerIds: string[]): string {
  const invite = parseShareInvitation(link)
  if (invite.version !== InvitationDataVersion.v5 || !isDeviceInvitationData(invite)) {
    throw new Error('Expected a QSS device invitation')
  }

  const ownerPair = invite.pairs.find(pair => pair.peerId === ownerPeerId)
  if (ownerPair == null) {
    throw new Error('Device invitation does not contain the owner peer')
  }
  const unawarePeerIdSet = new Set(unawarePeerIds)
  const unawarePairs = invite.pairs.filter(pair => unawarePeerIdSet.has(pair.peerId))
  expect(unawarePairs).toHaveLength(unawarePeerIds.length)

  return composeInvitationShareUrl({
    ...invite,
    pairs: [...unawarePairs, ownerPair],
    qssEnabled: false,
  })
}

async function setP2pEnabled(app: App, enabled: boolean): Promise<void> {
  const settings = await new Sidebar(app.driver).openSettings()
  expect(await settings.isReady()).toBeTruthy()
  await settings.openDebugTab()

  if ((await settings.p2pToggleSwitchState()) !== enabled) {
    await settings.clickP2pToggleSwitch()
  }
  for (let attempt = 0; attempt < 20; attempt += 1) {
    if ((await settings.p2pToggleSwitchState()) === enabled) {
      break
    }
    await sleep(500)
  }
  expect(await settings.p2pToggleSwitchState()).toBe(enabled)
  await settings.closeTabThenModal()
}

async function createQssCommunity(owner: App, communityName: string, username: string): Promise<Channel> {
  await owner.openWithRetries(undefined, true)

  const joinModal = new JoinCommunityModal(owner.driver)
  expect(await joinModal.isReady()).toBeTruthy()
  await joinModal.switchToCreateCommunity()

  const createModal = new CreateCommunityModal(owner.driver)
  expect(await createModal.isReady()).toBeTruthy()
  await createModal.typeCommunityName(communityName)
  await createModal.submit()

  const serverOfferModal = new ServerOfferModal(owner.driver)
  expect(await serverOfferModal.isReady()).toBeTruthy()
  await serverOfferModal.chooseUseServer()

  const registerModal = new RegisterUsernameModal(owner.driver)
  expect(await registerModal.isReady()).toBeTruthy()
  await registerModal.typeUsername(username)
  await registerModal.submit()

  const termsModal = new TermsOfServiceModal(owner.driver)
  expect(await termsModal.isReady()).toBeTruthy()
  await termsModal.chooseAgreeAndJoin()

  await new JoiningLoadingPanel(owner.driver).waitForJoinToComplete()
  const channel = new Channel(owner.driver, 'general')
  expect(await channel.isReady()).toBeTruthy()
  expect(await channel.isMessageInputReady()).toBeTruthy()
  return channel
}

async function getMemberInvitation(app: App): Promise<string> {
  const settings = await new Sidebar(app.driver).openSettings()
  expect(await settings.isReady()).toBeTruthy()
  await settings.switchTab(SettingsModalTabName.INVITE)
  const link = await (await settings.invitationLink()).getText()
  await settings.closeTabThenModal()
  return link
}

async function getDeviceInvitation(app: App): Promise<string> {
  const settings = await new Sidebar(app.driver).openSettings()
  expect(await settings.isReady()).toBeTruthy()
  await settings.switchTab(SettingsModalTabName.LINKED_DEVICES)
  const link = await (await settings.deviceLink()).getText()
  await settings.closeTabThenModal()
  return link
}

async function joinMember(app: App, invitationLink: string, username: string): Promise<void> {
  await app.openWithRetries(undefined, true)

  const joinModal = new JoinCommunityModal(app.driver)
  expect(await joinModal.isReady()).toBeTruthy()
  await joinModal.typeCommunityInviteLink(invitationLink)
  await joinModal.submit()

  const registerModal = new RegisterUsernameModal(app.driver)
  expect(await registerModal.isReady()).toBeTruthy()
  await registerModal.clearInput()
  await registerModal.typeUsername(username)
  await registerModal.submit()

  const termsModal = new TermsOfServiceModal(app.driver)
  expect(await termsModal.isReady()).toBeTruthy()
  await termsModal.chooseAgreeAndJoin()

  await new JoiningLoadingPanel(app.driver).waitForJoinToComplete()
  const channel = new Channel(app.driver, 'general')
  expect(await channel.isReady()).toBeTruthy()
  expect(await channel.isMessageInputReady()).toBeTruthy()
}

async function closeAndCleanupApps(apps: App[]): Promise<void> {
  for (const app of [...apps].reverse()) {
    try {
      if (app.isOpened) {
        await app.close()
      }
      await app.cleanup()
    } catch (error) {
      logger.error(`Error cleaning up adversarial app ${app.name}:`, error)
    }
  }
}

async function runInviteUnawarePeerRetryScenario(unawarePeerCount: number): Promise<void> {
  const ownerUsername = `retry-owner-${unawarePeerCount}`
  const owner = new App({ username: `${ownerUsername}-primary` })
  const linkedDevice = new App({ username: `${ownerUsername}-linked` })
  const stalePeerCount = unawarePeerCount
  const proxies = await Promise.all(Array.from({ length: stalePeerCount }, () => startQssProxy()))
  const stalePeers = proxies.map((proxy, index) => ({
    username: `invite-unaware-${unawarePeerCount}-${index}`,
    app: new App({ username: `invite-unaware-${unawarePeerCount}-${index}` }),
    proxy,
    peerId: undefined as string | undefined,
  }))
  const unawarePeers = stalePeers.slice(0, unawarePeerCount)
  const apps = [owner, linkedDevice, ...stalePeers.map(peer => peer.app)]

  try {
    const ownerChannelBeforeRetry = await createQssCommunity(
      owner,
      `retry${unawarePeerCount}${Date.now().toString(36)}`,
      ownerUsername
    )
    const memberInvitation = await getMemberInvitation(owner)
    const ownerPairs = parseShareInvitation(memberInvitation).pairs
    if (ownerPairs.length !== 1) {
      throw new Error(
        `Expected the initial member invitation to contain only the owner, got ${ownerPairs.length} peers`
      )
    }
    const ownerPeerId = ownerPairs[0].peerId
    const knownPeerIds = new Set([ownerPeerId])

    for (const peer of stalePeers) {
      await joinMember(peer.app, routeMemberInviteThroughProxy(memberInvitation, peer.proxy.endpoint), peer.username)
      const registrationMessage = `@${peer.username} has joined and will be registered soon. 🎉 Learn more`
      await ownerChannelBeforeRetry.getMessageIdsByText(registrationMessage, peer.username, 120_000)

      const updatedPairs = parseShareInvitation(await getMemberInvitation(owner)).pairs
      const joinedPairs = updatedPairs.filter(pair => !knownPeerIds.has(pair.peerId))
      if (joinedPairs.length !== 1) {
        throw new Error(`Expected one new peer after ${peer.username} joined, got ${joinedPairs.length}`)
      }
      peer.peerId = joinedPairs[0].peerId
      knownPeerIds.add(peer.peerId)
    }
    const stalePeerIds = stalePeers.map(peer => {
      if (peer.peerId == null) {
        throw new Error(`Missing peer ID for ${peer.username}`)
      }
      return peer.peerId
    })
    const unawarePeerIds = stalePeerIds.slice(0, unawarePeerCount)

    // Disconnect the existing members from QSS, then take the invite creator
    // offline before creating the device invite. The stale peers remain
    // continuously reachable over P2P without receiving the new invite proof.
    await Promise.all(proxies.map(proxy => proxy.stop()))
    await setP2pEnabled(owner, false)

    const deviceInvitation = makeP2pOnlyDeviceInvite(await getDeviceInvitation(owner), ownerPeerId, unawarePeerIds)

    for (const peer of stalePeers) {
      peer.app.buildSetup.clearProcessOutput()
    }

    await linkedDevice.openWithRetries(undefined, true)
    const joinModal = new JoinCommunityModal(linkedDevice.driver)
    expect(await joinModal.isReady()).toBeTruthy()
    await joinModal.typeCommunityInviteLink(deviceInvitation)
    await joinModal.submit()

    const joinPanel = new JoiningLoadingPanel(linkedDevice.driver)
    expect(await joinPanel.waitUntilVisible()).toBeTruthy()
    await Promise.all(
      unawarePeers.map(peer => peer.app.buildSetup.waitForProcessOutput('INVITATION_PROOF_INVALID', 240_000))
    )
    owner.buildSetup.clearProcessOutput()
    await setP2pEnabled(owner, true)
    await owner.buildSetup.waitForProcessOutput(`connected to ${stalePeerIds[0]}`, 180_000)
    const readinessMessage = `Device admission may proceed after ${unawarePeerCount} stale peer rejection(s)`
    const readinessMessageIds = await ownerChannelBeforeRetry.sendMessage(readinessMessage, ownerUsername)

    await joinPanel.waitForJoinToComplete(60_000, 360_000)

    const ownerChannelAfterRetry = new Channel(owner.driver, 'general')
    expect(await ownerChannelAfterRetry.isReady()).toBeTruthy()
    const linkedChannel = new Channel(linkedDevice.driver, 'general')
    expect(await linkedChannel.isReady()).toBeTruthy()
    expect(await linkedChannel.isMessageInputReady()).toBeTruthy()
    expect(await linkedChannel.getMessageIdsByText(readinessMessage, ownerUsername, 120_000)).toEqual(
      readinessMessageIds
    )
    const message = `Linked after ${unawarePeerCount} invite-unaware rejection(s)`
    const sentMessageIds = await linkedChannel.sendMessage(message, ownerUsername)
    expect(await ownerChannelAfterRetry.getMessageIdsByText(message, ownerUsername, 120_000)).toEqual(sentMessageIds)
  } finally {
    await Promise.allSettled(proxies.map(proxy => proxy.stop()))
    await closeAndCleanupApps(apps)
  }
}

describe('Device linking message replication (QSS)', () => {
  const communityName = 'linkeddevices'
  const generalChannelName = 'general'

  let users: DeviceLinkingUsers
  let qssLogTailProcess: ChildProcess
  let memberInvitationLink: string
  let deviceLink: string
  let primaryChannel: Channel
  let linkedDeviceChannel: Channel
  let memberChannel: Channel
  let stageStartTime: number

  beforeAll(() => {
    qssLogTailProcess = tailQssLogs()
    users = {
      primary: {
        username: 'device-owner',
        messages: {
          fromPrimaryDevice: 'Message from the primary linked device',
          fromLinkedDevice: 'Message from the secondary linked device',
        },
        app: new App({ username: 'device-owner-primary' }),
      },
      linkedDevice: {
        app: new App({ username: 'device-owner-linked' }),
      },
      member: {
        username: 'new-member',
        messages: {
          afterJoining: 'Hello from the newly joined member',
        },
        app: new App({ username: 'new-member' }),
      },
    }
  })

  afterAll(async () => {
    qssLogTailProcess.kill()
    for (const user of Object.values(users)) {
      try {
        await user.app.close()
        await user.app.cleanup()
      } catch (error) {
        logger.error(`Error cleaning up app ${user.app.name}:`, error)
      }
    }
  })

  beforeEach(() => {
    logger.info(`░░░ ${expect.getState().currentTestName}`)
    stageStartTime = Date.now()
  })

  afterEach(() => {
    logger.info(`${expect.getState().currentTestName} Test duration: ${Date.now() - stageStartTime}ms`)
  })

  describe('Primary device creates the community and links a second device', () => {
    it('creates a QSS community and generates member and device links', async () => {
      await users.primary.app.openWithRetries(undefined, true)

      const joinModal = new JoinCommunityModal(users.primary.app.driver)
      expect(await joinModal.isReady()).toBeTruthy()
      await joinModal.switchToCreateCommunity()

      const createModal = new CreateCommunityModal(users.primary.app.driver)
      expect(await createModal.isReady()).toBeTruthy()
      await createModal.typeCommunityName(communityName)
      await createModal.submit()

      const serverOfferModal = new ServerOfferModal(users.primary.app.driver)
      expect(await serverOfferModal.isReady()).toBeTruthy()
      await serverOfferModal.chooseUseServer()

      const registerModal = new RegisterUsernameModal(users.primary.app.driver)
      expect(await registerModal.isReady()).toBeTruthy()
      await registerModal.typeUsername(users.primary.username)
      await registerModal.submit()

      const termsModal = new TermsOfServiceModal(users.primary.app.driver)
      expect(await termsModal.isReady()).toBeTruthy()
      await termsModal.chooseAgreeAndJoin()

      const joinPanel = new JoiningLoadingPanel(users.primary.app.driver)
      await joinPanel.waitForJoinToComplete()

      primaryChannel = new Channel(users.primary.app.driver, generalChannelName)
      expect(await primaryChannel.isReady()).toBeTruthy()
      expect(await primaryChannel.isOpen()).toBeTruthy()
      expect(await primaryChannel.isMessageInputReady()).toBeTruthy()

      const memberSettings = await new Sidebar(users.primary.app.driver).openSettings()
      expect(await memberSettings.isReady()).toBeTruthy()
      await memberSettings.switchTab(SettingsModalTabName.INVITE)
      memberInvitationLink = await (await memberSettings.invitationLink()).getText()
      expect(memberInvitationLink.length).toBeGreaterThan(0)
      await memberSettings.closeTabThenModal()

      const deviceSettings = await new Sidebar(users.primary.app.driver).openSettings()
      expect(await deviceSettings.isReady()).toBeTruthy()
      await deviceSettings.switchTab(SettingsModalTabName.LINKED_DEVICES)
      deviceLink = await (await deviceSettings.deviceLink()).getText()
      expect(deviceLink.length).toBeGreaterThan(0)
      await deviceSettings.closeTabThenModal()
    })

    it('submits a device link on a second desktop without registering another member', async () => {
      await users.linkedDevice.app.openWithRetries(undefined, true)

      const joinModal = new JoinCommunityModal(users.linkedDevice.app.driver)
      expect(await joinModal.isReady()).toBeTruthy()
      await joinModal.typeCommunityInviteLink(deviceLink)
      await joinModal.submit()
    })

    it('shows the joining loading panel while the linked device is joining', async () => {
      const joinPanel = new JoiningLoadingPanel(users.linkedDevice.app.driver)
      expect(await joinPanel.waitUntilVisible()).toBeTruthy()
      await joinPanel.waitForJoinToComplete()

      linkedDeviceChannel = new Channel(users.linkedDevice.app.driver, generalChannelName)
      expect(await linkedDeviceChannel.isReady()).toBeTruthy()
      expect(await linkedDeviceChannel.isOpen()).toBeTruthy()
      expect(await linkedDeviceChannel.isMessageInputReady()).toBeTruthy()
    })
  })

  describe('A third desktop client joins as a new member', () => {
    it('registers the third client with the member invitation', async () => {
      await users.member.app.openWithRetries(undefined, true)

      const joinModal = new JoinCommunityModal(users.member.app.driver)
      expect(await joinModal.isReady()).toBeTruthy()
      await joinModal.typeCommunityInviteLink(memberInvitationLink)
      await joinModal.submit()

      const registerModal = new RegisterUsernameModal(users.member.app.driver)
      expect(await registerModal.isReady()).toBeTruthy()
      await registerModal.clearInput()
      await registerModal.typeUsername(users.member.username)
      await registerModal.submit()

      const termsModal = new TermsOfServiceModal(users.member.app.driver)
      expect(await termsModal.isReady()).toBeTruthy()
      await termsModal.chooseAgreeAndJoin()

      const joinPanel = new JoiningLoadingPanel(users.member.app.driver)
      await joinPanel.waitForJoinToComplete()

      memberChannel = new Channel(users.member.app.driver, generalChannelName)
      expect(await memberChannel.isReady()).toBeTruthy()
      expect(await memberChannel.isOpen()).toBeTruthy()
      expect(await memberChannel.isMessageInputReady()).toBeTruthy()
    })

    it("shows the new member's registration message on both linked clients", async () => {
      const registrationMessage = `@${users.member.username} has joined and will be registered soon. 🎉 Learn more`
      const [primaryMessageIds, linkedMessageIds] = await Promise.all([
        primaryChannel.getMessageIdsByText(registrationMessage, users.member.username, 120_000),
        linkedDeviceChannel.getMessageIdsByText(registrationMessage, users.member.username, 120_000),
      ])

      expect(primaryMessageIds).toEqual(linkedMessageIds)
    })
  })

  describe('Messages converge on both linked clients', () => {
    it("replicates the new member's message to both linked clients", async () => {
      const sentMessageIds = await memberChannel.sendMessage(users.member.messages.afterJoining, users.member.username)
      const [primaryMessageIds, linkedMessageIds] = await Promise.all([
        primaryChannel.getMessageIdsByText(users.member.messages.afterJoining, users.member.username, 120_000),
        linkedDeviceChannel.getMessageIdsByText(users.member.messages.afterJoining, users.member.username, 120_000),
      ])

      expect(primaryMessageIds).toEqual(sentMessageIds)
      expect(linkedMessageIds).toEqual(sentMessageIds)
    })

    it("replicates the primary device's message to the linked device and new member", async () => {
      const sentMessageIds = await primaryChannel.sendMessage(
        users.primary.messages.fromPrimaryDevice,
        users.primary.username
      )
      const [linkedMessageIds, memberMessageIds] = await Promise.all([
        linkedDeviceChannel.getMessageIdsByText(
          users.primary.messages.fromPrimaryDevice,
          users.primary.username,
          120_000
        ),
        memberChannel.getMessageIdsByText(users.primary.messages.fromPrimaryDevice, users.primary.username, 120_000),
      ])

      expect(linkedMessageIds).toEqual(sentMessageIds)
      expect(memberMessageIds).toEqual(sentMessageIds)
    })

    it("replicates the linked device's message to the primary device and new member under the same user", async () => {
      const sentMessageIds = await linkedDeviceChannel.sendMessage(
        users.primary.messages.fromLinkedDevice,
        users.primary.username
      )
      const [primaryMessageIds, memberMessageIds] = await Promise.all([
        primaryChannel.getMessageIdsByText(users.primary.messages.fromLinkedDevice, users.primary.username, 120_000),
        memberChannel.getMessageIdsByText(users.primary.messages.fromLinkedDevice, users.primary.username, 120_000),
      ])

      expect(primaryMessageIds).toEqual(sentMessageIds)
      expect(memberMessageIds).toEqual(sentMessageIds)
    })
  })
})

describe('Device linking retries through invite-unaware peers (QSS)', () => {
  it('retries with the invite creator after one invite-unaware peer rejects the device', async () => {
    await runInviteUnawarePeerRetryScenario(1)
  })

  it('retries across two invite-unaware peers before reaching the invite creator', async () => {
    await runInviteUnawarePeerRetryScenario(2)
  })
})

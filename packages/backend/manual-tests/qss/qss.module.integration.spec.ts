import { Test, TestingModule } from '@nestjs/testing'
import { EventsType, IPFSAccessController } from '@orbitdb/core'
import { jest } from '@jest/globals'
import { randomBytes, randomUUID } from 'crypto'
import waitForExpect from 'wait-for-expect'

import { Community, CommunityOwnership, Identity, InvitationDataVersion } from '@quiet/types'
import { TestModule } from '../../src/nest/common/test.module'
import { QSS_ALLOWED, QSS_ENDPOINT } from '../../src/nest/const'
import { SigChainService } from '../../src/nest/auth/sigchain.service'
import { SigChainModule } from '../../src/nest/auth/sigchain.service.module'
import { EncryptedAndSignedPayload, EncryptionScopeType } from '../../src/nest/auth/services/crypto/types'
import { RoleName } from '../../src/nest/auth/services/roles/roles'
import { CaptchaService } from '../../src/nest/captcha/captcha.service'
import { IpfsFileManagerModule } from '../../src/nest/ipfs-file-manager/ipfs-file-manager.module'
import { IpfsModule } from '../../src/nest/ipfs/ipfs.module'
import { IpfsService } from '../../src/nest/ipfs/ipfs.service'
import { JoinStatus } from '../../src/nest/libp2p/libp2p.auth'
import { Libp2pService } from '../../src/nest/libp2p/libp2p.service'
import { Libp2pEvents, type Libp2pNodeParams } from '../../src/nest/libp2p/libp2p.types'
import { LocalDbService } from '../../src/nest/local-db/local-db.service'
import { spawnLibp2pInstancesInMemory } from '../../src/nest/common/test-utils'
import { getInMemoryLibp2pInstanceParams } from '../../src/nest/common/utils'
import { OrbitDbService } from '../../src/nest/storage/orbitDb/orbitDb.service'
import { OrbitDbModule } from '../../src/nest/storage/orbitDb/orbitdb.module'
import { EventsWithStorage } from '../../src/nest/storage/orbitDb/eventsWithStorage'
import { QSSAuthConnectionManager } from '../../src/nest/qss/qss-auth-conn-manager.service'
import { QSSAuthConnStatus } from '../../src/nest/qss/qss.const'
import { QSSClient } from '../../src/nest/qss/qss.client'
import { QSSModule } from '../../src/nest/qss/qss.module'
import { QSSService } from '../../src/nest/qss/qss.service'
import { QSSSyncManager } from '../../src/nest/qss/qss-sync-manager.service'
import { QSSOperationResult } from '../../src/nest/qss/qss.types'

const RUN_QSS_MODULE_INTEGRATION =
  process.env.QSS_MODULE_INTEGRATION === '1' || process.env.RUN_QSS_INTEGRATION_TESTS === 'true'
const QSS_INTEGRATION_ENDPOINT =
  process.env.QSS_INTEGRATION_ENDPOINT ?? process.env.QSS_ENDPOINT ?? 'http://localhost:3003'
const HCAPTCHA_TEST_TOKEN = '10000000-aaaa-bbbb-cccc-000000000001'
const maybeDescribe = RUN_QSS_MODULE_INTEGRATION ? describe : describe.skip

interface QSSIntegrationPeer {
  name: string
  module: TestingModule
  qssService: QSSService
  qssClient: QSSClient
  qssAuthConnManager: QSSAuthConnectionManager
  qssSyncManager: QSSSyncManager
  sigChainService: SigChainService
  localDbService: LocalDbService
  libp2pService: Libp2pService
  ipfsService: IpfsService
  orbitDbService: OrbitDbService
  captchaService: CaptchaService
}

function healthUrl(endpoint: string): string {
  const parsed = new URL(endpoint)
  parsed.protocol = parsed.protocol === 'wss:' ? 'https:' : 'http:'
  parsed.pathname = '/health'
  parsed.search = ''
  parsed.hash = ''
  return parsed.toString()
}

async function assertQssIsReachable(endpoint: string): Promise<void> {
  try {
    const response = await fetch(healthUrl(endpoint))
    if (!response.ok) {
      throw new Error(`QSS health check failed with ${response.status} ${response.statusText}`)
    }
  } catch (e) {
    const reason = e instanceof Error ? e.message : String(e)
    throw new Error(
      `QSS integration tests require a running dockerized QSS server at ${endpoint}. ` +
        `Start QSS or set QSS_INTEGRATION_ENDPOINT to the local server URL. Health check error: ${reason}`
    )
  }
}

function testIdentity(communityId: string, userId: string): Identity {
  return {
    communityId,
    userId,
    networkInfo: {
      hiddenService: {
        onionAddress: `${randomUUID().replaceAll('-', '')}.onion`,
        privateKey: randomBytes(32).toString('base64'),
      },
      peerId: {
        id: randomUUID(),
        privKey: randomBytes(32).toString('base64'),
      },
    },
    joinTimestamp: null,
  }
}

async function createPeer(name: string): Promise<QSSIntegrationPeer> {
  const module = await Test.createTestingModule({
    imports: [TestModule, SigChainModule, IpfsFileManagerModule, IpfsModule, OrbitDbModule, QSSModule],
  })
    .overrideProvider(QSS_ALLOWED)
    .useValue(true)
    .overrideProvider(QSS_ENDPOINT)
    .useValue(QSS_INTEGRATION_ENDPOINT)
    .compile()

  const peer: QSSIntegrationPeer = {
    name,
    module,
    qssService: module.get(QSSService),
    qssClient: module.get(QSSClient),
    qssAuthConnManager: module.get(QSSAuthConnectionManager),
    qssSyncManager: module.get(QSSSyncManager),
    sigChainService: module.get(SigChainService),
    localDbService: module.get(LocalDbService),
    libp2pService: await module.resolve(Libp2pService),
    ipfsService: await module.resolve(IpfsService),
    orbitDbService: module.get(OrbitDbService),
    captchaService: module.get(CaptchaService),
  }

  peer.qssSyncManager.onModuleInit()
  await peer.localDbService.open()

  return peer
}

async function startPeerStorage(peer: QSSIntegrationPeer): Promise<void> {
  await startPeerLibp2p(peer)
  await startPeerDataStorage(peer)
}

async function startPeerLibp2p(peer: QSSIntegrationPeer, params?: Libp2pNodeParams): Promise<Libp2pNodeParams> {
  if (params != null) {
    await peer.libp2pService.createInstance(params)
    return params
  }

  const [createdParams] = await spawnLibp2pInstancesInMemory([peer.module])
  return createdParams
}

async function startPeerDataStorage(peer: QSSIntegrationPeer): Promise<void> {
  await peer.ipfsService.createInstance()
  await peer.ipfsService.start()
  await peer.orbitDbService.create(peer.ipfsService.ipfsInstance!)
}

async function setCurrentCommunity(
  peer: QSSIntegrationPeer,
  community: Community,
  userId = peer.sigChainService.user.userId
): Promise<void> {
  await peer.localDbService.setCommunity(community)
  await peer.localDbService.setCurrentCommunityId(community.id)
  await peer.localDbService.setIdentity(testIdentity(community.id, userId))
}

async function waitForQssSetup(peer: QSSIntegrationPeer): Promise<void> {
  await waitForExpect(async () => {
    expect((await peer.qssService.getQssInitStatus()).qssSetup).toBe(true)
  }, 60_000)
}

async function waitForAuthReady(peer: QSSIntegrationPeer, teamId: string): Promise<void> {
  await waitForExpect(() => {
    const authConnection = peer.qssAuthConnManager.getConnection(teamId)
    expect(authConnection).toBeDefined()
    expect(authConnection!.connStatus).toBe(QSSAuthConnStatus.CONNECTED)
    expect(authConnection!.joinStatus).toBe(JoinStatus.JOINED)
  }, 60_000)
}

async function waitForMemberRole(peer: QSSIntegrationPeer, teamId: string): Promise<void> {
  await waitForExpect(() => {
    const sigChain = peer.sigChainService.getChain(teamId)
    expect(sigChain.roles.amIMemberOfRole(RoleName.MEMBER)).toBe(true)
  }, 60_000)
}

async function waitForDisconnected(peer: QSSIntegrationPeer, teamId: string): Promise<void> {
  await waitForExpect(() => {
    expect(peer.qssService.connected).toBe(false)
    expect(peer.qssAuthConnManager.getConnection(teamId)).toBeUndefined()
  }, 20_000)
}

interface DeviceAdmissionPayload {
  teamId: string
  userId: string
  deviceId: string
  deviceAdmission: boolean
}

async function dialAndWaitForDeviceAdmission(
  linkedDevice: QSSIntegrationPeer,
  acceptingPeer: QSSIntegrationPeer
): Promise<DeviceAdmissionPayload> {
  let timeout: NodeJS.Timeout | undefined
  let admissionHandler: ((payload: DeviceAdmissionPayload) => void) | undefined
  const admission = new Promise<DeviceAdmissionPayload>((resolve, reject) => {
    admissionHandler = payload => resolve(payload)
    linkedDevice.libp2pService.once(Libp2pEvents.AUTH_JOINED, admissionHandler)
    timeout = setTimeout(() => reject(new Error('Device admission over libp2p timed out')), 60_000)
  })

  try {
    const dial = linkedDevice.libp2pService.dialPeer(acceptingPeer.libp2pService.localAddress, {
      throwOnError: true,
      redialOnError: false,
    })
    await Promise.race([dial, admission])
    await dial
    return await admission
  } finally {
    if (timeout != null) {
      clearTimeout(timeout)
    }
    if (admissionHandler != null) {
      linkedDevice.libp2pService.off(Libp2pEvents.AUTH_JOINED, admissionHandler)
    }
  }
}

async function disconnectWithoutAutoReconnect(peer: QSSIntegrationPeer, teamId: string): Promise<void> {
  peer.qssClient.close()
  ;(peer.qssService as unknown as { _clearReconnectTimer(resetDelay?: boolean): void })._clearReconnectTimer(true)
  await waitForDisconnected(peer, teamId)
}

async function reconnectAndSignIn(peer: QSSIntegrationPeer, teamId: string, teamName: string): Promise<void> {
  const connectResult = await peer.qssService.connect(QSS_INTEGRATION_ENDPOINT, true)
  expect(connectResult).toBe(QSSOperationResult.SUCCESS)

  expect(peer.sigChainService.getChain(teamId)).toBeDefined()
  await waitForAuthReady(peer, teamId)
  await waitForMemberRole(peer, teamId)
  peer.qssService.markTeamStorageReady(teamId)
}

async function openQssBackedEventsStore(
  peer: QSSIntegrationPeer,
  storeName: string,
  teamId: string
): Promise<EventsType<EncryptedAndSignedPayload>> {
  const store = await peer.orbitDbService.open<EventsType<EncryptedAndSignedPayload>>(storeName, {
    type: 'events',
    Database: EventsWithStorage(),
    AccessController: IPFSAccessController({ write: ['*'] }),
    sync: false,
  })
  OrbitDbService.updateMetadata(store, { teamId })
  return store
}

async function addEncryptedEntry(
  peer: QSSIntegrationPeer,
  store: EventsType<EncryptedAndSignedPayload>,
  message: string
): Promise<string> {
  const encryptedMessage = peer.sigChainService.activeChain.crypto.encryptAndSign(message, {
    type: EncryptionScopeType.ROLE,
    name: RoleName.MEMBER,
  })
  return await store.add(encryptedMessage)
}

async function readMessages(peer: QSSIntegrationPeer, store: EventsType<EncryptedAndSignedPayload>): Promise<string[]> {
  const messages: string[] = []
  for await (const entry of store.iterator()) {
    if (entry.value == null) {
      continue
    }

    const decrypted = peer.sigChainService.activeChain.crypto.decryptAndVerify<string>(
      entry.value.encrypted,
      entry.value.signature
    )
    expect(decrypted.isValid).toBe(true)
    messages.push(decrypted.contents)
  }
  return messages
}

async function waitForStoreMessage(
  peer: QSSIntegrationPeer,
  store: EventsType<EncryptedAndSignedPayload>,
  message: string
): Promise<void> {
  await waitForExpect(async () => {
    expect(await readMessages(peer, store)).toContain(message)
  }, 60_000)
}

async function expectPendingSyncContains(peer: QSSIntegrationPeer, address: string, hash: string): Promise<void> {
  await waitForExpect(async () => {
    const pending = await peer.localDbService.getPendingQssLogSyncMessages()
    expect(pending[address] ?? []).toContain(hash)
  }, 10_000)
}

async function waitForPendingSyncToDrain(peer: QSSIntegrationPeer, address: string, hash: string): Promise<void> {
  await waitForExpect(async () => {
    const pending = await peer.localDbService.getPendingQssLogSyncMessages()
    expect(pending[address] ?? []).not.toContain(hash)
  }, 60_000)
}

async function waitForLastSyncSeqAtLeast(
  peer: QSSIntegrationPeer,
  teamId: string,
  minimumSeq: number
): Promise<number> {
  let observedSeq = 0
  await waitForExpect(async () => {
    observedSeq = (await peer.localDbService.getLastSyncSeq(teamId)) ?? 0
    expect(observedSeq).toBeGreaterThanOrEqual(minimumSeq)
  }, 60_000)
  return observedSeq
}

async function cleanupPeer(peer: QSSIntegrationPeer): Promise<void> {
  try {
    peer.qssService.close()
    await peer.orbitDbService.stop()
    await peer.ipfsService.stop()
    await peer.libp2pService.close(false)
    await new Promise(resolve => setTimeout(resolve, 1_000))
    await peer.libp2pService.closeDatastore()
    await peer.localDbService.close()
    await peer.module.close()
  } catch (e) {
    // Keep cleanup best-effort so the original failure remains visible.
  }
}

maybeDescribe('QSSModule create-community owner sync against dockerized QSS', () => {
  jest.setTimeout(180_000)

  const peers: QSSIntegrationPeer[] = []

  afterAll(async () => {
    for (const peer of peers.reverse()) {
      await cleanupPeer(peer)
    }
  })

  it('syncs owner log entries in the same session that created the QSS community', async () => {
    await assertQssIsReachable(QSS_INTEGRATION_ENDPOINT)

    const owner = await createPeer('qss-create-owner')
    peers.push(owner)

    const teamName = `qss-create-owner-${randomUUID()}`
    const ownerSigChain = await owner.sigChainService.createChain(true)
    const teamId = ownerSigChain.team!.id

    await setCurrentCommunity(owner, {
      id: randomUUID(),
      name: teamName,
      ownership: CommunityOwnership.Owner,
      peerList: [],
      psk: randomBytes(32).toString('base64'),
      teamId,
      qssEnabled: true,
      qssEndpoint: QSS_INTEGRATION_ENDPOINT,
      qssSetup: false,
    })
    await startPeerStorage(owner)

    owner.captchaService.hcaptchaToken = HCAPTCHA_TEST_TOKEN
    expect(await owner.qssService.connect(QSS_INTEGRATION_ENDPOINT, true)).toBe(QSSOperationResult.SUCCESS)
    await waitForQssSetup(owner)
    await waitForAuthReady(owner, teamId)
    await waitForMemberRole(owner, teamId)

    const store = await openQssBackedEventsStore(owner, `channels.qss-create-owner-${randomUUID()}`, teamId)
    owner.qssService.markTeamStorageReady(teamId)

    const hash = await addEncryptedEntry(owner, store, 'qss integration: owner create-community session sync')
    await owner.qssSyncManager.waitForLogEntrySyncAck(hash, 60_000)
    await waitForPendingSyncToDrain(owner, store.address, hash)
  })

  it('keeps pending sync DLQ entries until storage readiness opens the replay gate', async () => {
    await assertQssIsReachable(QSS_INTEGRATION_ENDPOINT)

    const owner = await createPeer('qss-storage-ready-owner')
    peers.push(owner)

    const teamName = `qss-storage-ready-owner-${randomUUID()}`
    const ownerSigChain = await owner.sigChainService.createChain(true)
    const teamId = ownerSigChain.team!.id

    await setCurrentCommunity(owner, {
      id: randomUUID(),
      name: teamName,
      ownership: CommunityOwnership.Owner,
      peerList: [],
      psk: randomBytes(32).toString('base64'),
      teamId,
      qssEnabled: true,
      qssEndpoint: QSS_INTEGRATION_ENDPOINT,
      qssSetup: false,
    })
    await startPeerStorage(owner)

    owner.captchaService.hcaptchaToken = HCAPTCHA_TEST_TOKEN
    expect(await owner.qssService.connect(QSS_INTEGRATION_ENDPOINT, true)).toBe(QSSOperationResult.SUCCESS)
    await waitForQssSetup(owner)
    await waitForAuthReady(owner, teamId)
    await waitForMemberRole(owner, teamId)

    const store = await openQssBackedEventsStore(owner, `channels.qss-storage-ready-${randomUUID()}`, teamId)

    await disconnectWithoutAutoReconnect(owner, teamId)

    const hash = await addEncryptedEntry(owner, store, 'qss integration: storage-ready gated dlq replay')
    await expectPendingSyncContains(owner, store.address, hash)

    expect(await owner.qssService.connect(QSS_INTEGRATION_ENDPOINT, true)).toBe(QSSOperationResult.SUCCESS)
    await waitForAuthReady(owner, teamId)
    await waitForMemberRole(owner, teamId)

    await owner.qssSyncManager.processDeadLetterQueue(teamId)
    await expectPendingSyncContains(owner, store.address, hash)

    owner.qssService.markTeamStorageReady(teamId)
    await waitForPendingSyncToDrain(owner, store.address, hash)
    await owner.qssSyncManager.waitForLogEntrySyncAck(hash, 60_000)
  })
})

maybeDescribe('QSSModule integration against dockerized QSS', () => {
  jest.setTimeout(300_000)

  const peers: QSSIntegrationPeer[] = []
  const teamName = `qss-module-${randomUUID()}`
  const ownerName = 'qss-owner'
  const inviteeName = 'qss-invitee'
  const storeName = `channels.qss-module-${randomUUID()}`

  let owner!: QSSIntegrationPeer
  let invitee!: QSSIntegrationPeer
  let invite!: { seed: string; salt: string }
  let teamId!: string
  let ownerStore!: EventsType<EncryptedAndSignedPayload>
  let inviteeStore!: EventsType<EncryptedAndSignedPayload>
  let ownerLibp2pParams!: Libp2pNodeParams

  afterAll(async () => {
    for (const peer of peers.reverse()) {
      await cleanupPeer(peer)
    }
  })

  it('creates an owner QSS community and starts owner auth sync', async () => {
    await assertQssIsReachable(QSS_INTEGRATION_ENDPOINT)

    owner = await createPeer(ownerName)
    peers.push(owner)

    const ownerSigChain = await owner.sigChainService.createChain(true)
    teamId = ownerSigChain.team!.id
    invite = ownerSigChain.invites.createLongLivedUserInvite() as { seed: string; salt: string }
    ownerSigChain.lockbox.createInviteLockboxes(invite.seed, invite.salt)
    await owner.sigChainService.saveChain(teamId)

    await setCurrentCommunity(owner, {
      id: randomUUID(),
      name: teamName,
      ownership: CommunityOwnership.Owner,
      peerList: [],
      psk: randomBytes(32).toString('base64'),
      teamId,
      qssEnabled: true,
      qssEndpoint: QSS_INTEGRATION_ENDPOINT,
      qssSetup: false,
    })
    ownerLibp2pParams = await startPeerLibp2p(owner)
    await startPeerDataStorage(owner)

    owner.captchaService.hcaptchaToken = HCAPTCHA_TEST_TOKEN
    expect(await owner.qssService.connect(QSS_INTEGRATION_ENDPOINT, true)).toBe(QSSOperationResult.SUCCESS)
    await waitForQssSetup(owner)
    await waitForAuthReady(owner, teamId)

    expect(await owner.qssService.signInToCommunity(teamId, ownerSigChain)).toBe(QSSOperationResult.SUCCESS)
  })

  it('joins an invitee to the QSS community and opens matching QSS-backed stores', async () => {
    expect(owner).toBeDefined()
    expect(invite).toBeDefined()
    expect(teamId).toBeDefined()

    invitee = await createPeer(inviteeName)
    peers.push(invitee)

    await invitee.sigChainService.createChainFromInvite({ seed: invite.seed }, teamId, true)
    await setCurrentCommunity(invitee, {
      id: randomUUID(),
      name: teamName,
      ownership: CommunityOwnership.User,
      peerList: [],
      psk: randomBytes(32).toString('base64'),
      teamId,
      qssEnabled: true,
      qssEndpoint: QSS_INTEGRATION_ENDPOINT,
      qssSetup: true,
      inviteData: {
        version: InvitationDataVersion.v5,
        pairs: [],
        psk: randomBytes(32).toString('base64'),
        authData: {
          communityName: teamName,
          seed: invite.seed,
          salt: invite.salt,
          teamId,
        },
        qssEnabled: true,
        qssEndpoint: QSS_INTEGRATION_ENDPOINT,
      },
    })

    expect(await invitee.qssService.connect(QSS_INTEGRATION_ENDPOINT, true)).toBe(QSSOperationResult.SUCCESS)
    await waitForAuthReady(invitee, teamId)
    await waitForMemberRole(invitee, teamId)
    await startPeerStorage(invitee)

    ownerStore = await openQssBackedEventsStore(owner, storeName, teamId)
    inviteeStore = await openQssBackedEventsStore(invitee, storeName, teamId)
    expect(ownerStore.address).toBe(inviteeStore.address)
    owner.qssService.markTeamStorageReady(teamId)
    invitee.qssService.markTeamStorageReady(teamId)
  })

  it('signs in, syncs logs, survives disconnects, and signs back in', async () => {
    const firstMessage = 'qss integration: online fanout'
    const firstHash = await addEncryptedEntry(owner, ownerStore, firstMessage)
    await owner.qssSyncManager.waitForLogEntrySyncAck(firstHash, 60_000)
    await waitForStoreMessage(invitee, inviteeStore, firstMessage)

    await disconnectWithoutAutoReconnect(owner, teamId)

    const pendingMessage = 'qss integration: pending dlq replay'
    const pendingHash = await addEncryptedEntry(owner, ownerStore, pendingMessage)
    await expectPendingSyncContains(owner, ownerStore.address, pendingHash)

    await reconnectAndSignIn(owner, teamId, teamName)
    await waitForPendingSyncToDrain(owner, ownerStore.address, pendingHash)
    await waitForStoreMessage(invitee, inviteeStore, pendingMessage)

    await disconnectWithoutAutoReconnect(invitee, teamId)

    const missedMessage = 'qss integration: historical pull after reconnect'
    const missedHash = await addEncryptedEntry(owner, ownerStore, missedMessage)
    await owner.qssSyncManager.waitForLogEntrySyncAck(missedHash, 60_000)
    const expectedMissedSeq = await waitForLastSyncSeqAtLeast(owner, teamId, 1)

    const pullSpy = jest.spyOn(invitee.qssSyncManager, 'pullLatestLogEntries')
    try {
      await reconnectAndSignIn(invitee, teamId, teamName)
      await waitForExpect(() => {
        expect(pullSpy).toHaveBeenCalledWith(teamId)
      }, 60_000)
      await waitForStoreMessage(invitee, inviteeStore, missedMessage)
      await waitForLastSyncSeqAtLeast(invitee, teamId, expectedMissedSeq)
    } finally {
      pullSpy.mockRestore()
    }

    const afterReconnectMessage = 'qss integration: fanout after reconnect'
    const afterReconnectHash = await addEncryptedEntry(owner, ownerStore, afterReconnectMessage)
    await owner.qssSyncManager.waitForLogEntrySyncAck(afterReconnectHash, 60_000)
    await waitForStoreMessage(invitee, inviteeStore, afterReconnectMessage)
  })

  it('syncs invitee-authored log entries back to the owner', async () => {
    const inviteeMessage = 'qss integration: invitee outbound fanout'
    const inviteeHash = await addEncryptedEntry(invitee, inviteeStore, inviteeMessage)
    await invitee.qssSyncManager.waitForLogEntrySyncAck(inviteeHash, 60_000)
    await waitForPendingSyncToDrain(invitee, inviteeStore.address, inviteeHash)
    await waitForStoreMessage(owner, ownerStore, inviteeMessage)
  })

  it('historically pulls log entries that existed before a new invitee connects', async () => {
    const lateMessage = 'qss integration: late invitee historical catch-up'
    const lateHash = await addEncryptedEntry(owner, ownerStore, lateMessage)
    await owner.qssSyncManager.waitForLogEntrySyncAck(lateHash, 60_000)
    const expectedLateSeq = await waitForLastSyncSeqAtLeast(owner, teamId, 1)

    const lateInviteeName = `qss-late-invitee-${randomUUID()}`
    const lateInvitee = await createPeer(lateInviteeName)
    peers.push(lateInvitee)

    await lateInvitee.sigChainService.createChainFromInvite({ seed: invite.seed }, teamId, true)
    await setCurrentCommunity(lateInvitee, {
      id: randomUUID(),
      name: teamName,
      ownership: CommunityOwnership.User,
      peerList: [],
      psk: randomBytes(32).toString('base64'),
      teamId,
      qssEnabled: true,
      qssEndpoint: QSS_INTEGRATION_ENDPOINT,
      qssSetup: true,
      inviteData: {
        version: InvitationDataVersion.v5,
        pairs: [],
        psk: randomBytes(32).toString('base64'),
        authData: {
          communityName: teamName,
          seed: invite.seed,
          salt: invite.salt,
          teamId,
        },
        qssEnabled: true,
        qssEndpoint: QSS_INTEGRATION_ENDPOINT,
      },
    })

    expect(await lateInvitee.qssService.connect(QSS_INTEGRATION_ENDPOINT, true)).toBe(QSSOperationResult.SUCCESS)
    await waitForAuthReady(lateInvitee, teamId)
    await waitForMemberRole(lateInvitee, teamId)
    await startPeerStorage(lateInvitee)

    const lateInviteeStore = await openQssBackedEventsStore(lateInvitee, storeName, teamId)
    expect(lateInviteeStore.address).toBe(ownerStore.address)

    lateInvitee.qssService.markTeamStorageReady(teamId)
    await waitForStoreMessage(lateInvitee, lateInviteeStore, lateMessage)
    await waitForLastSyncSeqAtLeast(lateInvitee, teamId, expectedLateSeq)
  })

  it('admits a linked device over P2P, authenticates it to QSS, and syncs logs in both directions', async () => {
    expect(owner).toBeDefined()
    expect(ownerStore).toBeDefined()
    expect(ownerLibp2pParams).toBeDefined()

    const ownerChain = owner.sigChainService.activeChain
    const ownerUserId = ownerChain.user.userId
    const ownerDeviceId = ownerChain.device.deviceId
    const deviceInvite = ownerChain.invites.createDeviceInvite()
    await owner.sigChainService.saveChain(teamId)

    const linkedDevice = await createPeer(`qss-linked-device-${randomUUID()}`)
    peers.push(linkedDevice)
    await linkedDevice.sigChainService.createChainFromDeviceInvite(
      {
        seed: deviceInvite.seed,
        userName: deviceInvite.userName,
        deviceName: 'QSS integration linked device',
        expectedTeamId: teamId,
        expectedUserId: deviceInvite.userId,
      },
      teamId,
      true
    )

    expect(linkedDevice.sigChainService.activeChain.isPendingDeviceAdmission).toBe(true)
    expect(linkedDevice.qssService.connected).toBe(false)
    expect(linkedDevice.qssAuthConnManager.getConnection(teamId)).toBeUndefined()

    await setCurrentCommunity(
      linkedDevice,
      {
        id: randomUUID(),
        name: teamName,
        ownership: CommunityOwnership.User,
        peerList: [owner.libp2pService.localAddress],
        psk: randomBytes(32).toString('base64'),
        teamId,
        qssEnabled: true,
        qssEndpoint: QSS_INTEGRATION_ENDPOINT,
        qssSetup: true,
      },
      ownerUserId
    )

    const params = await getInMemoryLibp2pInstanceParams()
    params.psk = ownerLibp2pParams.psk
    await startPeerLibp2p(linkedDevice, params)

    const admission = await dialAndWaitForDeviceAdmission(linkedDevice, owner)
    const linkedChain = linkedDevice.sigChainService.activeChain
    expect(admission).toMatchObject({
      teamId,
      userId: ownerUserId,
      deviceAdmission: true,
    })
    expect(linkedChain.isPendingDeviceAdmission).toBe(false)
    expect(linkedChain.team?.id).toBe(teamId)
    expect(linkedChain.user.userId).toBe(ownerUserId)
    expect(linkedChain.device.deviceId).not.toBe(ownerDeviceId)
    expect(admission.deviceId).toBe(linkedChain.device.deviceId)
    expect(linkedChain.team?.hasDevice(linkedChain.device.deviceId)).toBe(true)
    expect(linkedChain.team?.members(ownerUserId).devices).toHaveLength(2)
    await waitForExpect(() => {
      expect(owner.sigChainService.activeChain.team?.hasDevice(linkedChain.device.deviceId)).toBe(true)
      expect(owner.sigChainService.activeChain.team?.members(ownerUserId).devices).toHaveLength(2)
    }, 20_000)
    await linkedDevice.sigChainService.saveChain(teamId)

    const historicalMessage = 'qss integration: linked device historical pull'
    const historicalHash = await addEncryptedEntry(owner, ownerStore, historicalMessage)
    await owner.qssSyncManager.waitForLogEntrySyncAck(historicalHash, 60_000)

    await startPeerDataStorage(linkedDevice)
    expect(await linkedDevice.qssService.connect(QSS_INTEGRATION_ENDPOINT, true)).toBe(QSSOperationResult.SUCCESS)
    await waitForAuthReady(linkedDevice, teamId)
    await waitForMemberRole(linkedDevice, teamId)

    const linkedDeviceStore = await openQssBackedEventsStore(linkedDevice, storeName, teamId)
    expect(linkedDeviceStore.address).toBe(ownerStore.address)
    linkedDevice.qssService.markTeamStorageReady(teamId)
    await waitForStoreMessage(linkedDevice, linkedDeviceStore, historicalMessage)

    const linkedDeviceMessage = 'qss integration: linked device outbound fanout'
    const linkedDeviceHash = await addEncryptedEntry(linkedDevice, linkedDeviceStore, linkedDeviceMessage)
    await linkedDevice.qssSyncManager.waitForLogEntrySyncAck(linkedDeviceHash, 60_000)
    await waitForStoreMessage(owner, ownerStore, linkedDeviceMessage)
  })
})

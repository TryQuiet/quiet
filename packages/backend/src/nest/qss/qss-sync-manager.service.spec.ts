import EventEmitter from 'node:events'
import { jest } from '@jest/globals'
import waitForExpect from 'wait-for-expect'

import { JoinStatus } from '../libp2p/libp2p.auth'
import { LogUpdate } from '../storage/orbitDb/orbitdb.types'
import { QSSAuthConnStatus } from './qss.const'
import { QSSSyncManager } from './qss-sync-manager.service'
import { CommunityOperationStatus, LogEntrySyncMessage, QSSEvents, WebsocketEvents } from './qss.types'

describe('QSSSyncManager', () => {
  const teamId = 'team-id'
  const userId = 'user-id'
  const address = 'channels.general'

  let qssClient: any
  let qssAuthConnManager: any
  let sigChainService: any
  let localDbService: any
  let orbitDbService: any
  let socketService: any
  let serializer: any
  let manager: QSSSyncManager
  let memberReady: boolean
  let authConnection: { connStatus: QSSAuthConnStatus; joinStatus: JoinStatus }

  const makeSigChain = () =>
    ({
      team: { id: teamId },
      context: { user: { userId } },
      roles: {
        amIMemberOfRole: jest.fn(() => memberReady),
      },
      crypto: {
        encryptAndSign: jest.fn((entry: unknown) => ({
          encrypted: { contents: entry },
          signature: { signature: 'sig', author: { type: 'USER', name: userId } },
        })),
      },
    }) as any

  const makeEntry = (hash: string) =>
    ({
      id: `db-${hash}`,
      hash,
      payload: { value: { teamId } },
    }) as any

  const makeUpdate = (hash: string): LogUpdate => ({
    id: `db-${hash}`,
    teamId,
    addr: address,
    hash,
    entry: makeEntry(hash),
  })

  beforeEach(() => {
    memberReady = true
    authConnection = {
      connStatus: QSSAuthConnStatus.CONNECTED,
      joinStatus: JoinStatus.JOINED,
    }

    qssClient = Object.assign(new EventEmitter(), {
      connected: true,
      sendMessage: jest.fn(),
    })
    qssAuthConnManager = Object.assign(new EventEmitter(), {
      getConnection: jest.fn(() => authConnection),
    })
    sigChainService = Object.assign(new EventEmitter(), {
      getChain: jest.fn(() => makeSigChain()),
    })
    localDbService = {
      getCurrentCommunity: jest.fn(async () => ({ qssEnabled: true, qssSetup: true })),
      addPendingQssLogSyncMessage: jest.fn(),
      getPendingQssLogSyncMessages: jest.fn(async () => ({})),
      removePendingQssLogSyncMessages: jest.fn(),
      getLastSyncSeq: jest.fn(async () => 1),
      setLastSyncSeq: jest.fn(),
    }
    orbitDbService = {
      outboundEvents: new EventEmitter(),
      getLogEntriesByHashes: jest.fn(async () => []),
      handleFanoutMessage: jest.fn(async () => true),
      ingestEntries: jest.fn(),
    }
    socketService = {
      serverIoProvider: {
        io: {
          emit: jest.fn(),
        },
      },
    }
    serializer = {
      serialize: jest.fn(),
      deserialize: jest.fn(),
    }

    manager = new QSSSyncManager(
      true,
      'ws://localhost:3000',
      qssClient as any,
      qssAuthConnManager as any,
      sigChainService as any,
      localDbService as any,
      orbitDbService as any,
      socketService as any,
      serializer as any
    )
  })

  afterEach(() => {
    manager.onModuleDestroy()
  })

  it('only sends entries emitted by its own OrbitDB service instance', () => {
    const sendSpy = jest.spyOn(manager, 'sendLogEntrySyncMessage').mockResolvedValue(undefined)
    const otherPeerEvents = new EventEmitter()

    manager.onModuleInit()
    otherPeerEvents.emit('put', makeUpdate('other-peer'))
    orbitDbService.outboundEvents.emit('put', makeUpdate('local-peer'))

    expect(sendSpy).toHaveBeenCalledTimes(1)
    expect(sendSpy).toHaveBeenCalledWith(makeUpdate('local-peer'))
  })

  it('does not pull or send before signed-in registration', async () => {
    const startSpy = jest.spyOn(manager, 'startLogPullInterval').mockImplementation(() => {})
    const dlqSpy = jest.spyOn(manager, 'processDeadLetterQueue').mockResolvedValue(undefined)

    manager.markTeamStorageReady(teamId)
    manager.markMemberRoleReady(teamId)

    const result = await manager.sendLogEntrySyncMessage(makeUpdate('not-signed-in'))

    expect(startSpy).not.toHaveBeenCalled()
    expect(dlqSpy).not.toHaveBeenCalled()
    expect(result).toBeUndefined()
    expect(qssClient.sendMessage).not.toHaveBeenCalled()
    expect(localDbService.addPendingQssLogSyncMessage).toHaveBeenCalledWith(address, 'not-signed-in')
  })

  it('does not write log syncs to the pending queue when QSS is unavailable on this client', async () => {
    manager.setQssAllowed(false)
    manager.startLogSyncForSignedInTeam(teamId, makeSigChain())

    const result = await manager.sendLogEntrySyncMessage(makeUpdate('qss-unavailable'))

    expect(result).toBeUndefined()
    expect(qssClient.sendMessage).not.toHaveBeenCalled()
    expect(localDbService.addPendingQssLogSyncMessage).not.toHaveBeenCalled()
  })

  it('does not pull or send while auth connection is only STARTING', async () => {
    authConnection.connStatus = QSSAuthConnStatus.STARTING
    const startSpy = jest.spyOn(manager, 'startLogPullInterval').mockImplementation(() => {})
    const dlqSpy = jest.spyOn(manager, 'processDeadLetterQueue').mockResolvedValue(undefined)

    manager.startLogSyncForSignedInTeam(teamId, makeSigChain())
    manager.markTeamStorageReady(teamId)
    const result = await manager.sendLogEntrySyncMessage(makeUpdate('starting-auth'))

    expect(startSpy).not.toHaveBeenCalled()
    expect(dlqSpy).not.toHaveBeenCalled()
    expect(result).toBeUndefined()
    expect(qssClient.sendMessage).not.toHaveBeenCalled()
    expect(localDbService.addPendingQssLogSyncMessage).toHaveBeenCalledWith(address, 'starting-auth')
  })

  it('does not pull or send while auth join status is pending member', async () => {
    authConnection.joinStatus = JoinStatus.PENDING_MEMBER
    const startSpy = jest.spyOn(manager, 'startLogPullInterval').mockImplementation(() => {})
    const dlqSpy = jest.spyOn(manager, 'processDeadLetterQueue').mockResolvedValue(undefined)

    manager.startLogSyncForSignedInTeam(teamId, makeSigChain())
    manager.markTeamStorageReady(teamId)
    const result = await manager.sendLogEntrySyncMessage(makeUpdate('pending-member'))

    expect(startSpy).not.toHaveBeenCalled()
    expect(dlqSpy).not.toHaveBeenCalled()
    expect(result).toBeUndefined()
    expect(qssClient.sendMessage).not.toHaveBeenCalled()
    expect(localDbService.addPendingQssLogSyncMessage).toHaveBeenCalledWith(address, 'pending-member')
  })

  it('does not pull or send without the member role', async () => {
    memberReady = false
    const startSpy = jest.spyOn(manager, 'startLogPullInterval').mockImplementation(() => {})
    const dlqSpy = jest.spyOn(manager, 'processDeadLetterQueue').mockResolvedValue(undefined)

    manager.startLogSyncForSignedInTeam(teamId, makeSigChain())
    manager.markTeamStorageReady(teamId)
    const result = await manager.sendLogEntrySyncMessage(makeUpdate('not-member'))

    expect(startSpy).not.toHaveBeenCalled()
    expect(dlqSpy).not.toHaveBeenCalled()
    expect(result).toBeUndefined()
    expect(qssClient.sendMessage).not.toHaveBeenCalled()
    expect(localDbService.addPendingQssLogSyncMessage).toHaveBeenCalledWith(address, 'not-member')
  })

  it('starts sync exactly once after signed in, storage ready, auth connected and joined, and member role ready', () => {
    memberReady = false
    authConnection.connStatus = QSSAuthConnStatus.STARTING
    authConnection.joinStatus = JoinStatus.PENDING_MEMBER
    const startSpy = jest.spyOn(manager, 'startLogPullInterval').mockImplementation(() => {})
    const dlqSpy = jest.spyOn(manager, 'processDeadLetterQueue').mockResolvedValue(undefined)

    manager.startLogSyncForSignedInTeam(teamId, makeSigChain())
    manager.markTeamStorageReady(teamId)
    authConnection.connStatus = QSSAuthConnStatus.CONNECTED
    qssAuthConnManager.emit(QSSEvents.QSS_AUTH_CONNECTED, teamId)
    authConnection.joinStatus = JoinStatus.JOINED
    qssAuthConnManager.emit(QSSEvents.QSS_AUTH_JOINED, teamId)

    expect(startSpy).not.toHaveBeenCalled()
    expect(dlqSpy).not.toHaveBeenCalled()

    memberReady = true
    manager.markMemberRoleReady(teamId)
    qssAuthConnManager.emit(QSSEvents.QSS_AUTH_JOINED, teamId)
    manager.markTeamStorageReady(teamId)

    expect(startSpy).toHaveBeenCalledTimes(1)
    expect(dlqSpy).toHaveBeenCalledTimes(1)
    expect(dlqSpy).toHaveBeenCalledWith(teamId)
  })

  it('replays pending outbound logs after the gate opens', async () => {
    const hash = 'replayed-hash'
    const pending: Record<string, string[]> = {}
    localDbService.addPendingQssLogSyncMessage.mockImplementation(async (addr: string, pendingHash: string) => {
      pending[addr] = [...(pending[addr] ?? []), pendingHash]
    })
    localDbService.getPendingQssLogSyncMessages.mockImplementation(async () => pending)
    localDbService.removePendingQssLogSyncMessages.mockImplementation(async (sent: Record<string, string[]>) => {
      for (const [addr, hashes] of Object.entries(sent)) {
        pending[addr] = (pending[addr] ?? []).filter(pendingHash => !hashes.includes(pendingHash))
        if (pending[addr].length === 0) {
          delete pending[addr]
        }
      }
    })
    orbitDbService.getLogEntriesByHashes.mockResolvedValue([makeEntry(hash)])
    qssClient.sendMessage.mockImplementation(async (event: WebsocketEvents, payload: unknown) => {
      if (event !== WebsocketEvents.LOG_ENTRY_SYNC) {
        return undefined
      }
      const { teamId: payloadTeamId, hash: payloadHash, hashedDbId } = (payload as LogEntrySyncMessage).payload
      return {
        status: CommunityOperationStatus.SUCCESS,
        payload: {
          teamId: payloadTeamId,
          hash: payloadHash,
          hashedDbId,
        },
      }
    })
    jest.spyOn(manager, 'startLogPullInterval').mockImplementation(() => {})

    await manager.sendLogEntrySyncMessage(makeUpdate(hash))
    expect(pending).toEqual({ [address]: [hash] })

    manager.startLogSyncForSignedInTeam(teamId, makeSigChain())
    manager.markTeamStorageReady(teamId)

    await waitForExpect(() => {
      expect(qssClient.sendMessage).toHaveBeenCalledWith(
        WebsocketEvents.LOG_ENTRY_SYNC,
        expect.objectContaining({ status: CommunityOperationStatus.SENDING }),
        true
      )
      expect(pending).toEqual({})
    })
  })

  it('restarts historical pulls from a later readiness event after the initial pull interval times out', async () => {
    jest.useFakeTimers()
    try {
      jest.spyOn(manager, 'pullLatestLogEntries').mockResolvedValue({
        ts: Date.now(),
        status: CommunityOperationStatus.ERROR,
        reason: 'temporary pull failure',
        payload: {
          hasNextPage: false,
          entries: [],
        },
      })
      const startSpy = jest.spyOn(manager, 'startLogPullInterval')

      manager.startLogSyncForSignedInTeam(teamId, makeSigChain())
      manager.markTeamStorageReady(teamId)

      expect(startSpy).toHaveBeenCalledTimes(1)

      await Promise.resolve()
      await Promise.resolve()
      jest.advanceTimersByTime(10_000)

      manager.markTeamStorageReady(teamId)

      expect(startSpy).toHaveBeenCalledTimes(2)
    } finally {
      manager.close()
      jest.useRealTimers()
    }
  })

  it('resolves ack waiters from a successful log sync ack', async () => {
    const hash = 'acked-hash'
    qssClient.sendMessage.mockResolvedValue({
      status: CommunityOperationStatus.SUCCESS,
      payload: {
        teamId,
        hash,
        hashedDbId: `db-${hash}`,
      },
    })
    manager.startLogSyncForSignedInTeam(teamId, makeSigChain())

    const waiter = manager.waitForLogEntrySyncAck(hash, 1_000)
    await manager.sendLogEntrySyncMessage(makeUpdate(hash))

    await expect(waiter).resolves.toBeUndefined()
  })
})

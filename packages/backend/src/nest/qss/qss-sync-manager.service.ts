import { Inject, Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { DateTime } from 'luxon'
import { LogEntry } from '@orbitdb/core'

import { SigChain } from '../auth/sigchain'
import { SigChainService } from '../auth/sigchain.service'
import { EncryptedAndSignedPayload, EncryptionScopeType } from '../auth/services/crypto/types'
import { RoleName } from '../auth/services/roles/roles'
import { createLogger } from '../common/logger'
import { Serializer } from '../common/serializer.service'
import { JoinStatus } from '../libp2p/libp2p.auth'
import { DLQDecryptEntry } from '../local-db/local-db.types'
import { LocalDbService } from '../local-db/local-db.service'
import { OrbitDbService } from '../storage/orbitDb/orbitDb.service'
import { LogUpdate } from '../storage/orbitDb/orbitdb.types'
import { logEntryToLogUpdate } from '../storage/orbitDb/util'
import { SocketService } from '../socket/socket.service'
import { NseSyncSeqUpdatedEvent, SocketEvents } from '@quiet/types'
import { QSS_ALLOWED, QSS_ENDPOINT } from '../const'
import { QSSAuthConnStatus } from './qss.const'
import { QSSAuthConnectionManager } from './qss-auth-conn-manager.service'
import { QSSClient } from './qss.client'
import {
  CommunityOperationStatus,
  LogEntryPullPayload,
  LogEntryPullResponseMessage,
  LogEntrySyncMessage,
  LogEntrySyncResponseMessage,
  QSSInitStatus,
  QSSEvents,
  WebsocketEvents,
} from './qss.types'
import { SigchainEvents } from '../auth/types'

const LOG_PULL_INTERVAL_MS = 1_000
const LOG_PULL_SUCCESS_TIMEOUT_MS = 10_000

@Injectable()
export class QSSSyncManager implements OnModuleDestroy, OnModuleInit {
  private _paused = false
  private _eventHandlersConfigured = false

  /**
   * Team IDs that completed the QSS sign-in request in this client session.
   */
  private readonly _signedInTeams: Map<string, SigChain | undefined> = new Map()

  /**
   * Map of team IDs to intervals pulling log entries.
   */
  private readonly _logPullIntervals: Map<string, NodeJS.Timeout> = new Map()

  /**
   * Map of team IDs to timeouts that stop log pull retries if none succeeds.
   */
  private readonly _logPullSuccessTimeouts: Map<string, NodeJS.Timeout> = new Map()

  /**
   * Team IDs whose local storage is ready to ingest QSS log history.
   */
  private readonly _storageReadyTeams: Set<string> = new Set()

  /**
   * Track log pull operations currently executing by team ID.
   */
  private readonly _logPullInFlight: Set<string> = new Set()

  /**
   * True while processing DLQ decrypt entries.
   */
  private _dlqDecryptInFlight = false

  /**
   * True if sigchain updated while DLQ processing was in flight.
   */
  private _dlqDecryptRetryRequested = false

  private _deadLetterQueueInFlight = false
  private readonly _deadLetterQueueRetryTeamIds: Set<string> = new Set()

  private readonly _logSyncWaiters: Map<
    string,
    { resolve: () => void; reject: (error: Error) => void; timeout: NodeJS.Timeout }[]
  > = new Map()
  private readonly _recentLogSyncResults: Map<string, { success: boolean; error?: Error }> = new Map()
  private readonly _qssConnectedEventsEmitted: Set<string> = new Set()
  private readonly _startedLogSyncTeams: Set<string> = new Set()

  private readonly logger = createLogger('qss:sync')

  constructor(
    @Inject(QSS_ALLOWED) private _qssAllowed: boolean,
    @Inject(QSS_ENDPOINT) private _qssEndpoint: string | undefined,
    private readonly qssClient: QSSClient,
    private readonly qssAuthConnManager: QSSAuthConnectionManager,
    private readonly sigChainService: SigChainService,
    private readonly localDbService: LocalDbService,
    private readonly orbitDbService: OrbitDbService,
    private readonly socketService: SocketService,
    private readonly serializer: Serializer
  ) {
    this._configureEventHandlers()
  }

  private get canConnect(): boolean {
    return this._qssAllowed && this._qssEndpoint !== '' && this._qssEndpoint != null
  }

  public setQssEndpoint(qssEndpoint: string | undefined): void {
    this._qssEndpoint = qssEndpoint
  }

  public setQssAllowed(qssAllowed: boolean): void {
    this._qssAllowed = qssAllowed
  }

  public onModuleInit(): void {
    OrbitDbService.events.on('put', this._handleOrbitDbPut)
  }

  public onModuleDestroy(): void {
    OrbitDbService.events.off('put', this._handleOrbitDbPut)
    this.close()
  }

  private _handleOrbitDbPut = (logUpdate: LogUpdate): void => {
    if (this._paused) {
      return
    }

    this.logger.debug('New log update detected, sending to QSS', logUpdate.hash)
    void this.sendLogEntrySyncMessage(logUpdate)
  }

  private _handleLogEntrySync = async (message: LogEntrySyncMessage): Promise<void> => {
    this.logger.debug('Forwarding fanout log entry sync message to OrbitDB service')
    const ingested = await this.orbitDbService.handleFanoutMessage(message)
    if (message.payload.syncSeq != null) {
      await this.handleObservedSyncSeq(
        message.payload.teamId,
        message.payload.syncSeq,
        ingested,
        `fanout hash=${message.payload.hash}`
      )
    }
  }

  private _handleAuthConnected = (teamId: string): void => {
    this.logger.debug('QSS auth connection connected', teamId)
    this._emitQssConnected(teamId)
    this._tryStartLogSync(teamId)
  }

  private _handleAuthJoined = (teamId: string): void => {
    this.logger.debug('QSS auth connection joined', teamId)
    this._tryStartLogSync(teamId)
  }

  private _handleAuthDisconnected = (teamId: string): void => {
    this.logger.info('QSS auth connection disconnected, stopping log sync', teamId)
    this.socketService.serverIoProvider.io.emit(SocketEvents.QSS_DISCONNECTED)
    this._stopLogPullInterval(teamId)
    this._logPullInFlight.delete(teamId)
    this._deadLetterQueueRetryTeamIds.delete(teamId)
    this._qssConnectedEventsEmitted.delete(teamId)
    this._startedLogSyncTeams.delete(teamId)
  }

  private _handleQssDisconnected = (): void => {
    this.logger.debug('QSS client disconnected, stopping all log sync intervals')
    for (const teamId of Array.from(this._signedInTeams.keys())) {
      this.stopLogSyncForTeam(teamId)
    }
  }

  private _handleSigChainUpdated = (teamId: string): void => {
    void this.processDLQDecrypt(teamId)
  }

  private _configureEventHandlers(): void {
    if (this._eventHandlersConfigured) {
      return
    }

    this.qssClient.on(WebsocketEvents.LOG_ENTRY_SYNC, this._handleLogEntrySync)
    this.qssClient.on(QSSEvents.QSS_DISCONNECTED, this._handleQssDisconnected)
    this.qssAuthConnManager.on(QSSEvents.QSS_AUTH_CONNECTED, this._handleAuthConnected)
    this.qssAuthConnManager.on(QSSEvents.QSS_AUTH_JOINED, this._handleAuthJoined)
    this.qssAuthConnManager.on(QSSEvents.QSS_DISCONNECTED, this._handleAuthDisconnected)
    this.sigChainService.on(SigchainEvents.UPDATED, this._handleSigChainUpdated)
    this._eventHandlersConfigured = true
  }

  private _teardownEventHandlers(): void {
    if (!this._eventHandlersConfigured) {
      return
    }

    this.qssClient.off(WebsocketEvents.LOG_ENTRY_SYNC, this._handleLogEntrySync)
    this.qssClient.off(QSSEvents.QSS_DISCONNECTED, this._handleQssDisconnected)
    this.qssAuthConnManager.off(QSSEvents.QSS_AUTH_CONNECTED, this._handleAuthConnected)
    this.qssAuthConnManager.off(QSSEvents.QSS_AUTH_JOINED, this._handleAuthJoined)
    this.qssAuthConnManager.off(QSSEvents.QSS_DISCONNECTED, this._handleAuthDisconnected)
    this.sigChainService.off(SigchainEvents.UPDATED, this._handleSigChainUpdated)
    this._eventHandlersConfigured = false
  }

  public startLogSyncForSignedInTeam(teamId: string, sigChain?: SigChain): void {
    this.logger.debug('Registering signed-in team for QSS log sync', teamId)
    this._signedInTeams.set(teamId, sigChain)
    if (this._isAuthConnectionConnected(teamId)) {
      this._emitQssConnected(teamId)
    }
    this._tryStartLogSync(teamId, sigChain)
  }

  public markTeamStorageReady(teamId: string): void {
    this.logger.debug('Marking team storage ready for QSS log pulls', teamId)
    this._storageReadyTeams.add(teamId)
    this._tryStartLogSync(teamId)
  }

  public markMemberRoleReady(teamId: string): void {
    this.logger.debug('Marking member role ready for QSS log sync', teamId)
    this._tryStartLogSync(teamId)
  }

  public stopLogSyncForTeam(teamId: string): void {
    this._stopLogPullInterval(teamId)
    this._logPullInFlight.delete(teamId)
    this._deadLetterQueueRetryTeamIds.delete(teamId)
    this._signedInTeams.delete(teamId)
    this._qssConnectedEventsEmitted.delete(teamId)
    this._startedLogSyncTeams.delete(teamId)
  }

  public pause(): void {
    this._paused = true
    this._teardownEventHandlers()
    this._clearLogPullIntervals()
    this._logPullInFlight.clear()
    this._deadLetterQueueRetryTeamIds.clear()
    this._signedInTeams.clear()
    this._qssConnectedEventsEmitted.clear()
    this._startedLogSyncTeams.clear()
  }

  public resume(): void {
    this._paused = false
    this._configureEventHandlers()
  }

  public close(): void {
    this._paused = true
    this._teardownEventHandlers()
    this._clearLogPullIntervals()
    this._logPullInFlight.clear()
    this._storageReadyTeams.clear()
    this._deadLetterQueueRetryTeamIds.clear()
    this._signedInTeams.clear()
    this._qssConnectedEventsEmitted.clear()
    this._startedLogSyncTeams.clear()

    for (const [hash, waiters] of this._logSyncWaiters.entries()) {
      for (const waiter of waiters) {
        clearTimeout(waiter.timeout)
        waiter.reject(new Error(`QSS service closed before log entry ${hash} was acknowledged`))
      }
    }
    this._logSyncWaiters.clear()
    this._recentLogSyncResults.clear()
  }

  public startLogPullInterval(teamId: string): void {
    if (this._logPullIntervals.has(teamId)) {
      this.logger.debug('Existing log pull interval, skipping', teamId)
      return
    }
    this.logger.debug('Starting log pull interval', teamId)

    const interval = setInterval(() => {
      void this._pullLatestLogEntriesForTeam(teamId)
    }, LOG_PULL_INTERVAL_MS)
    const successTimeout = setTimeout(() => {
      this.logger.warn('Stopping log pull interval after timeout waiting for success', teamId)
      this._startedLogSyncTeams.delete(teamId)
      this._stopLogPullInterval(teamId)
    }, LOG_PULL_SUCCESS_TIMEOUT_MS)

    this._logPullIntervals.set(teamId, interval)
    this._logPullSuccessTimeouts.set(teamId, successTimeout)
    void this._pullLatestLogEntriesForTeam(teamId)
  }

  private _tryStartLogSync(teamId: string, sigChain?: SigChain): void {
    const readiness = this._getHistoricalSyncReadiness(teamId, sigChain)
    if (!readiness.ready) {
      this.logger.info(readiness.reason, teamId)
      return
    }

    if (this._startedLogSyncTeams.has(teamId)) {
      return
    }

    this._startedLogSyncTeams.add(teamId)
    this.logger.info('QSS sync gate ready, starting log pulls and pending sync DLQ processing', teamId)
    this.startLogPullInterval(teamId)
    void this.processDeadLetterQueue(teamId)
  }

  private _getHistoricalSyncReadiness(
    teamId: string,
    sigChain?: SigChain
  ): { ready: true; sigChain: SigChain } | { ready: false; reason: string } {
    if (this._paused) {
      return { ready: false, reason: 'QSS sync manager is paused' }
    }

    if (!this.canConnect) {
      return { ready: false, reason: 'QSS is not enabled, waiting before starting log sync' }
    }

    if (!this._signedInTeams.has(teamId)) {
      return { ready: false, reason: 'QSS team is not signed in, waiting before starting log sync' }
    }

    if (!this.qssClient.connected) {
      return { ready: false, reason: 'QSS client is disconnected, waiting before starting log sync' }
    }

    if (!this._storageReadyTeams.has(teamId)) {
      return { ready: false, reason: 'QSS auth is ready, waiting for storage before pulling historical log entries' }
    }

    const authReadiness = this._getAuthReadiness(teamId)
    if (!authReadiness.ready) {
      return authReadiness
    }

    const roleReadiness = this._getMemberRoleReadiness(teamId, sigChain)
    if (!roleReadiness.ready) {
      return roleReadiness
    }

    return roleReadiness
  }

  private _getOutboundSyncReadiness(
    teamId: string,
    sigChain?: SigChain
  ): { ready: true; sigChain: SigChain } | { ready: false; reason: string } {
    if (this._paused) {
      return { ready: false, reason: 'QSS sync manager is paused' }
    }

    if (!this.canConnect) {
      return { ready: false, reason: 'QSS is not enabled, deferring log sync' }
    }

    if (!this._signedInTeams.has(teamId)) {
      return { ready: false, reason: 'QSS team is not signed in, deferring log sync' }
    }

    if (!this.qssClient.connected) {
      return { ready: false, reason: 'QSS client is disconnected, deferring log sync' }
    }

    const authReadiness = this._getAuthReadiness(teamId)
    if (!authReadiness.ready) {
      return authReadiness
    }

    return this._getMemberRoleReadiness(teamId, sigChain)
  }

  private _getAuthReadiness(teamId: string): { ready: true } | { ready: false; reason: string } {
    const authConnection = this.qssAuthConnManager.getConnection(teamId)
    if (authConnection == null) {
      return { ready: false, reason: 'QSS auth connection is missing, waiting before log sync' }
    }

    if (authConnection.connStatus !== QSSAuthConnStatus.CONNECTED) {
      return { ready: false, reason: 'QSS auth connection is not fully connected, waiting before log sync' }
    }

    if (authConnection.joinStatus !== JoinStatus.JOINED) {
      return { ready: false, reason: 'QSS auth connection is not fully joined, waiting before log sync' }
    }

    return { ready: true }
  }

  private _getMemberRoleReadiness(
    teamId: string,
    sigChain?: SigChain
  ): { ready: true; sigChain: SigChain } | { ready: false; reason: string } {
    let chain = sigChain ?? this._signedInTeams.get(teamId)
    if (chain?.team == null) {
      try {
        chain = this.sigChainService.getChain(teamId)
      } catch (e) {
        return { ready: false, reason: 'Sigchain is unavailable, waiting before QSS log sync' }
      }
    }

    if (chain.team == null) {
      return { ready: false, reason: 'Sigchain team is unavailable, waiting before QSS log sync' }
    }

    if (!chain.roles.amIMemberOfRole(RoleName.MEMBER)) {
      return { ready: false, reason: 'Member role is unavailable, waiting before QSS log sync' }
    }

    return { ready: true, sigChain: chain }
  }

  private _isAuthConnectionConnected(teamId: string): boolean {
    return this.qssAuthConnManager.getConnection(teamId)?.connStatus === QSSAuthConnStatus.CONNECTED
  }

  private _emitQssConnected(teamId: string): void {
    if (this._qssConnectedEventsEmitted.has(teamId)) {
      return
    }

    this._qssConnectedEventsEmitted.add(teamId)
    this.socketService.serverIoProvider.io.emit(SocketEvents.QSS_CONNECTED)
  }

  private _clearLogPullIntervals(): void {
    for (const interval of this._logPullIntervals.values()) {
      clearInterval(interval)
    }
    this._logPullIntervals.clear()
    for (const timeout of this._logPullSuccessTimeouts.values()) {
      clearTimeout(timeout)
    }
    this._logPullSuccessTimeouts.clear()
  }

  private async _pullLatestLogEntriesForTeam(teamId: string): Promise<void> {
    if (this._logPullInFlight.has(teamId)) {
      this.logger.debug('Skipping log entry pull because one is already in flight', teamId)
      return
    }

    const readiness = this._getHistoricalSyncReadiness(teamId)
    if (!readiness.ready) {
      this.logger.info(readiness.reason, teamId)
      return
    }

    this.logger.debug('Pulling latest log entries from QSS', teamId)

    this._logPullInFlight.add(teamId)
    try {
      const response = await this.pullLatestLogEntries(teamId)
      if (response.status === CommunityOperationStatus.SUCCESS) {
        this._stopLogPullInterval(teamId)
      }
    } catch (e) {
      this.logger.error('Failed to pull latest log entries for team', e)
    } finally {
      this._logPullInFlight.delete(teamId)
    }
  }

  private _stopLogPullInterval(teamId: string): void {
    this.logger.debug('Stopping log pull interval', teamId)
    const existingInterval = this._logPullIntervals.get(teamId)
    if (existingInterval != null) {
      clearInterval(existingInterval)
      this._logPullIntervals.delete(teamId)
    }

    const existingTimeout = this._logPullSuccessTimeouts.get(teamId)
    if (existingTimeout != null) {
      clearTimeout(existingTimeout)
      this._logPullSuccessTimeouts.delete(teamId)
    }
  }

  public async processDeadLetterQueue(teamId: string): Promise<void> {
    this._deadLetterQueueRetryTeamIds.add(teamId)
    if (this._deadLetterQueueInFlight) {
      this.logger.debug('QSS data sync dead letter queue already processing, requesting retry', teamId)
      return
    }

    this._deadLetterQueueInFlight = true
    try {
      while (this._deadLetterQueueRetryTeamIds.size > 0) {
        const nextTeamId = this._deadLetterQueueRetryTeamIds.values().next().value
        if (nextTeamId == null) {
          break
        }
        this._deadLetterQueueRetryTeamIds.delete(nextTeamId)
        await this._processDeadLetterQueueOnce(nextTeamId)
      }
    } finally {
      this._deadLetterQueueInFlight = false
    }
  }

  private async _processDeadLetterQueueOnce(teamId: string): Promise<void> {
    const readiness = this._getHistoricalSyncReadiness(teamId)
    if (!readiness.ready) {
      this.logger.warn(`Not ready to process dlq of log sync messages for team ${teamId}: ${readiness.reason}`)
      return
    }

    this.logger.info('Processing QSS data sync dead letter queue')

    const unsentHashesByAddr = await this.localDbService.getPendingQssLogSyncMessages()
    const entries = Object.entries(unsentHashesByAddr)
    this.logger.info(`Found ${Object.entries(unsentHashesByAddr).length} unsent hashes to send to QSS`)
    const successes: Record<string, string[]> = {}
    const hashesToRemoveByAddr: Record<string, string[]> = {}
    for (const [address, unsentHashes] of entries) {
      const successByAddr: string[] = []
      const hashesToRemove: string[] = []
      const unsentEntries: LogEntry[] = []
      try {
        const retrievedEntries = await this.orbitDbService.getLogEntriesByHashes(address, unsentHashes)
        unsentEntries.push(...retrievedEntries.filter((entry): entry is LogEntry => entry != null))
      } catch (e) {
        this.logger.error(`Failed to retrieve unsent log entries for address ${address}`, e)
        continue
      }
      const foundHashes = new Set(unsentEntries.map(entry => entry.hash))
      for (const hash of unsentHashes) {
        if (!foundHashes.has(hash)) {
          hashesToRemove.push(hash)
        }
      }
      for (const entry of unsentEntries) {
        const success = await this.sendLogEntrySyncMessage(logEntryToLogUpdate(entry, address, teamId))
        if (success) {
          successByAddr.push(entry.hash)
        } else {
          this.logger.warn(`Failed to send ${entry.hash} to QSS`)
        }
      }
      if (successByAddr.length > 0) {
        successes[address] = successByAddr
      }
      if (hashesToRemove.length > 0 || successByAddr.length > 0) {
        hashesToRemoveByAddr[address] = [...hashesToRemove, ...successByAddr]
      }
    }
    const removeCount = Object.keys(hashesToRemoveByAddr).length
    const successCount = Object.keys(successes).length
    if (removeCount > 0) {
      await this.localDbService.removePendingQssLogSyncMessages(hashesToRemoveByAddr)
    }
    if (successCount < entries.length) {
      this.logger.warn(`Failed to send ${entries.length - successCount} entries to QSS, will retry later...`)
    }
  }

  public async sendLogEntrySyncMessage(update: LogUpdate): Promise<boolean | undefined> {
    if (!this.canConnect) {
      this.logger.info(`Can't send log sync message to QSS because QSS is not enabled for this community`)
      this.recordLogSyncFailure(update.hash, `QSS is not enabled; cannot sync log entry ${update.hash}`)
      return
    }

    const initStatus = await this.getQssInitStatus()

    if (!initStatus.qssEnabled) {
      this.logger.verbose(`Can't sync to QSS because QSS is disabled on this community`)
      this.recordLogSyncFailure(update.hash, `QSS is disabled for this community; cannot sync log entry ${update.hash}`)
      return
    }

    let sigChain: SigChain
    try {
      sigChain = this.sigChainService.getChain(update.teamId)
    } catch (e) {
      this.logger.warn(
        `No sigchain present for team ${update.teamId}, cannot send ${update.hash} log sync message to QSS`
      )
      this.recordLogSyncFailure(
        update.hash,
        `No sigchain present for team ${update.teamId}; cannot sync ${update.hash}`
      )
      return
    }

    const readiness = this._getOutboundSyncReadiness(update.teamId, sigChain)
    if (!readiness.ready) {
      this.logger.warn(`${readiness.reason}; writing entry to dead letter queue`, update.hash, update.teamId)
      await this._recordPendingLogSync(update.addr, update.hash, readiness.reason)
      return undefined
    }

    this.logger.info('Syncing OrbitDB entry to QSS', update.hash)

    this.logger.verbose('Encrypting log entry', update.hash)
    const encEntry: EncryptedAndSignedPayload = sigChain.crypto.encryptAndSign(update.entry, {
      type: EncryptionScopeType.ROLE,
      name: RoleName.MEMBER,
    })

    const dataSyncMessage: LogEntrySyncMessage = {
      ts: DateTime.utc().toMillis(),
      status: CommunityOperationStatus.SENDING,
      payload: {
        teamId: update.teamId,
        hash: update.hash,
        hashedDbId: update.id,
        encEntry,
      },
    }

    return await this._sendLogEntrySyncMessage(dataSyncMessage, update.addr)
  }

  private async _sendLogEntrySyncMessage(
    dataSyncMessage: LogEntrySyncMessage,
    address: string
  ): Promise<boolean | undefined> {
    const hash = dataSyncMessage.payload!.hash
    const teamId = dataSyncMessage.payload.teamId
    if (!this.qssClient.connected) {
      this.logger.warn('QSS not connected, writing entry to dead letter queue', hash, teamId)
      await this._recordPendingLogSync(address, hash, `QSS not connected; cannot sync log entry ${hash}`)
      return undefined
    }

    this.logger.debug('Sending log sync message to QSS', hash, teamId)
    const dataSyncAck = await this.qssClient.sendMessage<LogEntrySyncResponseMessage>(
      WebsocketEvents.LOG_ENTRY_SYNC,
      dataSyncMessage,
      true
    )

    let success = false
    if (dataSyncAck == null) {
      this.logger.error('Error while sending a log sync to QSS', hash, teamId)
      this.recordLogSyncFailure(hash, `No QSS ack received for log entry ${hash}`)
    } else if (dataSyncAck.status !== CommunityOperationStatus.SUCCESS) {
      this.logger.error(`Error while sending a log sync to QSS - ${dataSyncAck.reason}`, hash, teamId)
      this.recordLogSyncFailure(hash, `QSS rejected log entry ${hash}: ${dataSyncAck.reason ?? 'unknown error'}`)
    } else {
      this.logger.debug('Successful log sync to QSS')
      if (dataSyncAck.payload.syncSeq != null) {
        await this.handleObservedSyncSeq(teamId, dataSyncAck.payload.syncSeq, true, `sync-ack hash=${hash}`)
      }
      success = true
      this.recordLogSyncSuccess(hash)
      this.qssClient.emit(QSSEvents.QSS_LOG_SYNCED, dataSyncMessage.payload.teamId)
    }

    if (!success) {
      try {
        this.logger.warn('Adding QSS sync record to dead letter queue', address, hash)
        await this.localDbService.addPendingQssLogSyncMessage(address, hash)
      } catch (e) {
        this.logger.error('Failed to write pending QSS log sync message to local DB', e)
      }
    }

    return success
  }

  private async _recordPendingLogSync(address: string, hash: string, reason: string): Promise<void> {
    this.recordLogSyncFailure(hash, reason)
    try {
      await this.localDbService.addPendingQssLogSyncMessage(address, hash)
    } catch (e) {
      this.logger.error('Failed to write pending QSS log sync message to local DB', e)
    }
  }

  public async waitForLogEntrySyncAck(hash: string, timeoutMs = 15_000): Promise<void> {
    const knownResult = this._recentLogSyncResults.get(hash)
    if (knownResult?.success) {
      return
    }
    if (knownResult?.error) {
      throw knownResult.error
    }

    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.removeLogSyncWaiter(hash, timeout)
        reject(new Error(`Timed out waiting for QSS to ack log entry ${hash}`))
      }, timeoutMs)

      const waiters = this._logSyncWaiters.get(hash) ?? []
      waiters.push({ resolve, reject, timeout })
      this._logSyncWaiters.set(hash, waiters)
    })
  }

  public async pullLogEntries(payload: LogEntryPullPayload): Promise<LogEntryPullResponseMessage> {
    this.logger.info(`Pulling log entries from QSS for team ${payload.teamId}`)

    const logEntryPullMessage = {
      ts: DateTime.utc().toMillis(),
      status: CommunityOperationStatus.SENDING,
      payload,
    }

    const pullResponse = await this.qssClient.sendMessage<LogEntryPullResponseMessage>(
      WebsocketEvents.LOG_ENTRY_PULL,
      logEntryPullMessage,
      true
    )

    if (pullResponse == null) {
      this.logger.error('Error while pulling log entries from QSS - Nullish response', payload.teamId)
      throw new Error('Nullish response from QSS')
    }

    if (pullResponse.status !== CommunityOperationStatus.SUCCESS) {
      this.logger.error(
        `Error while pulling log entries from QSS - ${pullResponse.status}: ${pullResponse.reason}`,
        payload.teamId
      )
      return pullResponse
    }

    this.logger.info(`Successfully pulled ${pullResponse.payload.entries.length} entries from QSS`, payload.teamId)
    return pullResponse
  }

  public async pullLatestLogEntries(teamId: string): Promise<LogEntryPullResponseMessage> {
    this.logger.info(`Pulling all log entries from QSS for team ${teamId}`)
    let nextStartSeq = await this.localDbService.getLastSyncSeq(teamId)
    const sigchain = this.sigChainService.getChain(teamId)
    const userId = sigchain.context.user.userId
    if (!sigchain.roles.amIMemberOfRole(RoleName.MEMBER)) {
      this.logger.warn(`User is not a member of team ${teamId}, skipping log entry pull until full join`)
      return {
        ts: DateTime.utc().toMillis(),
        status: CommunityOperationStatus.UNAUTHORIZED,
        payload: {
          hasNextPage: false,
          entries: [],
        },
      }
    }

    let hasNextPage = true
    let page = 0
    let highestSyncSeq: number | undefined = nextStartSeq ?? undefined
    while (hasNextPage) {
      const pullPayload: LogEntryPullPayload = {
        teamId,
        userId,
        ...(nextStartSeq != null ? { startSeq: nextStartSeq } : { startSeq: 0 }),
        startTs: 0,
      }
      this.logger.info(`Pulling log entries page ${page} from QSS for team ${teamId}`)
      const pullResponse = await this.pullLogEntries(pullPayload)
      if (pullResponse.status !== CommunityOperationStatus.SUCCESS) {
        return pullResponse
      }
      if (pullResponse.payload.highestSyncSeq != null) {
        highestSyncSeq =
          highestSyncSeq == null
            ? pullResponse.payload.highestSyncSeq
            : Math.max(highestSyncSeq, pullResponse.payload.highestSyncSeq)
      }
      const deserializedEntries = pullResponse.payload.entries
        .map(entry => {
          try {
            return this.serializer.deserialize(entry)
          } catch (e) {
            this.logger.error('Failed to deserialize pulled log entry', e)
            return null
          }
        })
        .filter((entry): entry is EncryptedAndSignedPayload => entry !== null) as EncryptedAndSignedPayload[]

      const decryptedEntries: LogEntry[] = []
      const failedEntries: EncryptedAndSignedPayload[] = []

      for (const entry of deserializedEntries) {
        try {
          const decrypted = this.sigChainService
            .getChain(teamId)
            .crypto.decryptAndVerify<LogEntry>(entry.encrypted, entry.signature, false)
          if (decrypted.isValid) {
            decryptedEntries.push(decrypted.contents)
          } else {
            failedEntries.push(entry)
          }
        } catch (e) {
          this.logger.error('Failed to decrypt and verify log entry', e)
          failedEntries.push(entry)
        }
      }

      for (const failedEntry of failedEntries) {
        try {
          await this.localDbService.addDLQDecryptEntry(teamId, failedEntry, this.serializer)
        } catch (e) {
          this.logger.error('Failed to add entry to DLQ', e)
        }
      }
      if (failedEntries.length > 0) {
        this.logger.info(`Added ${failedEntries.length} entries to decrypt DLQ for team ${teamId}`)
      }

      try {
        await this.orbitDbService.ingestEntries(decryptedEntries)
        if (pullResponse.payload.highestSyncSeq != null) {
          nextStartSeq = pullResponse.payload.highestSyncSeq
          await this.updateLastSyncSeq(teamId, pullResponse.payload.highestSyncSeq)
        }
      } catch (e) {
        this.logger.error('Failed to ingest pulled log entries from QSS into OrbitDB', e)
        throw e
      }
      hasNextPage = pullResponse.payload.hasNextPage
      page += 1
    }
    const finalPullResponse: LogEntryPullResponseMessage = {
      ts: DateTime.utc().toMillis(),
      status: CommunityOperationStatus.SUCCESS,
      payload: {
        entries: [],
        hasNextPage: false,
        highestSyncSeq,
        resolvedStartSeq: nextStartSeq ?? undefined,
      },
    }
    this.logger.info(`Completed pulling all log entries from QSS for team ${teamId}`)
    return finalPullResponse
  }

  private async handleObservedSyncSeq(
    teamId: string,
    syncSeq: number,
    ingested: boolean,
    source: string
  ): Promise<void> {
    if (!Number.isFinite(syncSeq) || syncSeq <= 0) {
      this.logger.warn(`Refusing to handle invalid sync seq for team ${teamId}: ${syncSeq} (${source})`)
      return
    }

    const existingSeq = await this.localDbService.getLastSyncSeq(teamId)

    if (!ingested) {
      this.logger.warn(
        `Observed sync seq ${syncSeq} for ${teamId} from ${source} but local ingest failed; reconciling by pull`
      )
      void this._pullLatestLogEntriesForTeam(teamId)
      return
    }

    if (existingSeq == null) {
      this.logger.debug(`No persisted sync seq for ${teamId}; establishing baseline via pull before advancing seq`)
      void this._pullLatestLogEntriesForTeam(teamId)
      return
    }

    if (syncSeq <= existingSeq) {
      return
    }

    if (syncSeq !== existingSeq + 1) {
      this.logger.warn(
        `Detected sync seq gap for ${teamId}: existing=${existingSeq} observed=${syncSeq} source=${source}; pulling reconciliation`
      )
      void this._pullLatestLogEntriesForTeam(teamId)
      return
    }

    await this.updateLastSyncSeq(teamId, syncSeq)
  }

  private async updateLastSyncSeq(teamId: string, syncSeq: number): Promise<void> {
    if (!Number.isFinite(syncSeq) || syncSeq <= 0) {
      this.logger.warn(`Refusing to persist invalid sync seq for team ${teamId}: ${syncSeq}`)
      return
    }

    const existingSeq = await this.localDbService.getLastSyncSeq(teamId)
    const nextSyncSeq = existingSeq == null ? syncSeq : Math.max(existingSeq, syncSeq)

    if (existingSeq === nextSyncSeq) {
      return
    }

    await this.localDbService.setLastSyncSeq(teamId, nextSyncSeq)
    const payload: NseSyncSeqUpdatedEvent = {
      teamId,
      lastSyncSeq: nextSyncSeq,
    }
    this.socketService.serverIoProvider.io.emit(SocketEvents.NSE_SYNC_SEQ_UPDATED, payload)
  }

  public async processDLQDecrypt(teamId: string): Promise<void> {
    if (this._paused) {
      return
    }

    if (this._dlqDecryptInFlight) {
      this.logger.debug('DLQ decrypt already in progress, requesting retry')
      this._dlqDecryptRetryRequested = true
      return
    }

    let activeChain: SigChain
    try {
      activeChain = this.sigChainService.getChain(teamId)
    } catch (e) {
      this.logger.debug('No sigchain present for decrypt DLQ processing', teamId)
      return
    }
    if (!activeChain?.team) {
      return
    }
    const BATCH_SIZE = 50

    this._dlqDecryptInFlight = true
    this._dlqDecryptRetryRequested = false
    this.logger.info(`Processing decrypt DLQ for team ${teamId}`)

    try {
      let recovered = 0
      let hasMore = true

      while (hasMore) {
        const entries = await this.localDbService.getDLQDecryptEntries(teamId, this.serializer, { limit: BATCH_SIZE })
        if (entries.length === 0) {
          hasMore = false
          continue
        }

        const successfulEntries: { key: string; entry: DLQDecryptEntry }[] = []
        const decryptedLogEntries: LogEntry[] = []

        for (const { key, entry } of entries) {
          try {
            const decrypted = this.sigChainService
              .getChain(teamId)
              .crypto.decryptAndVerify<LogEntry>(entry.payload.encrypted, entry.payload.signature, false)
            if (decrypted.isValid) {
              decryptedLogEntries.push(decrypted.contents)
              successfulEntries.push({ key, entry })
            }
          } catch (e) {
            // Still can't decrypt, leave in DLQ.
          }
        }

        if (decryptedLogEntries.length > 0) {
          try {
            await this.orbitDbService.ingestEntries(decryptedLogEntries)
            await this.localDbService.removeDLQDecryptEntries(teamId, successfulEntries)
            recovered += decryptedLogEntries.length
          } catch (e) {
            this.logger.error('Failed to ingest recovered DLQ entries', e)
          }
        }

        if (successfulEntries.length === 0) {
          hasMore = false
        }
      }

      const remaining = await this.localDbService.getDLQDecryptCount(teamId)
      if (!this._paused) {
        this.logger.info(`DLQ processing complete: recovered=${recovered}, remaining=${remaining}`)
      }
    } finally {
      this._dlqDecryptInFlight = false
    }

    if (!this._paused && this._dlqDecryptRetryRequested) {
      this.logger.debug('Retrying DLQ decrypt after sigchain update during processing')
      await this.processDLQDecrypt(teamId)
    }
  }

  public async getQssInitStatus(): Promise<QSSInitStatus> {
    const community = await this.localDbService.getCurrentCommunity()
    const status: QSSInitStatus = {
      communityInitialized: false,
      qssEnabled: false,
      qssSetup: false,
      community,
    }
    if (community == null) {
      return status
    }

    return {
      ...status,
      qssEnabled: (community as any).qssEnabled ?? false,
      qssSetup: (community as any).qssSetup ?? false,
      communityInitialized: true,
    }
  }

  private recordLogSyncSuccess(hash: string): void {
    this.setRecentLogSyncResult(hash, { success: true })
    const waiters = this._logSyncWaiters.get(hash)
    if (waiters == null) {
      return
    }

    this._logSyncWaiters.delete(hash)
    for (const waiter of waiters) {
      clearTimeout(waiter.timeout)
      waiter.resolve()
    }
  }

  private recordLogSyncFailure(hash: string, message: string): void {
    const error = new Error(message)
    this.setRecentLogSyncResult(hash, { success: false, error })
    const waiters = this._logSyncWaiters.get(hash)
    if (waiters == null) {
      return
    }

    this._logSyncWaiters.delete(hash)
    for (const waiter of waiters) {
      clearTimeout(waiter.timeout)
      waiter.reject(error)
    }
  }

  private setRecentLogSyncResult(hash: string, result: { success: boolean; error?: Error }): void {
    if (this._recentLogSyncResults.has(hash)) {
      this._recentLogSyncResults.delete(hash)
    }
    this._recentLogSyncResults.set(hash, result)

    const maxTrackedResults = 200
    while (this._recentLogSyncResults.size > maxTrackedResults) {
      const oldestHash = this._recentLogSyncResults.keys().next().value
      if (oldestHash == null) {
        break
      }
      this._recentLogSyncResults.delete(oldestHash)
    }
  }

  private removeLogSyncWaiter(hash: string, timeout: NodeJS.Timeout): void {
    const waiters = this._logSyncWaiters.get(hash)
    if (waiters == null) {
      return
    }

    const remainingWaiters = waiters.filter(waiter => waiter.timeout !== timeout)
    if (remainingWaiters.length === 0) {
      this._logSyncWaiters.delete(hash)
      return
    }

    this._logSyncWaiters.set(hash, remainingWaiters)
  }
}

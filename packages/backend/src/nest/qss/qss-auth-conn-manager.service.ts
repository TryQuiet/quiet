/**
 * Manages auth sync connections with QSS
 */
import { Injectable, OnModuleDestroy } from '@nestjs/common'
import { ModuleRef } from '@nestjs/core'
import { randomInt } from 'crypto'
import EventEmitter from 'events'
import * as uint8arrays from 'uint8arrays'

import { createLogger } from '../common/logger'
import { QSSAuthConnection } from './qss-auth-conn'
import { QSSClient } from './qss.client'
import { AuthSyncMessage, QSSAuthAttemptFailurePayload, QSSEvents, WebsocketEvents } from './qss.types'

@Injectable()
export class QSSAuthConnectionManager extends EventEmitter implements OnModuleDestroy {
  /**
   * Map of team IDs to QSS auth sync connections
   */
  private readonly authConnMap: Map<string, QSSAuthConnection> = new Map()
  private readonly startConnectionPromises: Map<string, Promise<void>> = new Map()

  private readonly logger = createLogger('qss:auth:conn:manager')

  constructor(
    private readonly qssClient: QSSClient,
    private readonly moduleRef: ModuleRef
  ) {
    super()
    this._configureEventHandlers()
  }

  /**
   * Close all open auth sync connections with QSS
   */
  public onModuleDestroy() {
    this.close(true)
    this.qssClient.off(QSSEvents.QSS_DISCONNECTED, this._handleQssClientDisconnected)
    this.qssClient.off(WebsocketEvents.AUTH_SYNC, this._handleAuthSyncMessage)
  }

  private _configureEventHandlers(): void {
    this.qssClient.on(QSSEvents.QSS_DISCONNECTED, this._handleQssClientDisconnected)
    this.qssClient.on(WebsocketEvents.AUTH_SYNC, this._handleAuthSyncMessage)
  }

  private readonly _handleAuthSyncMessage = (message: AuthSyncMessage): void => {
    try {
      if (message.payload?.message == null) {
        throw new Error(`Missing message`)
      }

      const currentClientSocket = this.qssClient.getClientSocket()
      if (currentClientSocket == null || !currentClientSocket.connected || !currentClientSocket.active) {
        throw new Error(`Cannot process auth sync message without an active QSS client socket`)
      }

      const teamId = message.payload.teamId
      const authConnection = this.getConnection(teamId)
      if (authConnection == null || !authConnection.active) {
        throw new Error(`Auth connection for team ${teamId} wasn't initialized, can't process auth sync message`)
      }
      if (!authConnection.isForClientSocket(currentClientSocket)) {
        this.stopConnection(teamId, false)
        throw new Error(
          `Auth connection for team ${teamId} belongs to a previous QSS client socket, can't process auth sync message`
        )
      }

      authConnection.deliver(uint8arrays.fromString(message.payload.message, 'base64'))
    } catch (e) {
      this.logger.error(`Error handling auth sync message`, e)
    }
  }

  private _handleQssClientDisconnected = (): void => {
    this.logger.info('QSS client disconnected, closing all QSS auth connections')
    this.close(false)
  }

  /**
   * Get an existing auth sync connection with QSS, if present
   *
   * @param teamId Team ID to get the QSS auth sync connection for
   * @returns Existing QSS auth connection for this team, if present
   */
  public getConnection(teamId: string): QSSAuthConnection | undefined {
    return this.authConnMap.get(teamId)
  }

  public markMemberRoleReady(teamId: string): void {
    const authConnection = this.authConnMap.get(teamId)
    if (authConnection == null) {
      this.logger.warn('No QSS auth connection found when marking member role ready', teamId)
      return
    }

    authConnection.markMemberRoleReady()
  }

  /**
   * Start an auth sync connection with QSS for a given team
   *
   * @param teamId Team ID to start a new auth sync connection with QSS for
   */
  public async startNewConnection(teamId: string): Promise<void> {
    const existingStartPromise = this.startConnectionPromises.get(teamId)
    if (existingStartPromise != null) {
      this.logger.warn('QSS auth connection start already in progress for team ID', teamId)
      return existingStartPromise
    }

    const startPromise = this._startNewConnection(teamId)
    this.startConnectionPromises.set(teamId, startPromise)
    try {
      await startPromise
    } finally {
      if (this.startConnectionPromises.get(teamId) === startPromise) {
        this.startConnectionPromises.delete(teamId)
      }
    }
  }

  private async _startNewConnection(teamId: string): Promise<void> {
    const currentClientSocket = this.qssClient.getClientSocket()
    if (currentClientSocket == null || !currentClientSocket.connected || !currentClientSocket.active) {
      throw new Error('Must have an active QSS client socket prior to starting an auth connection!')
    }

    // check for an existing connection for this team
    const existingAuthConnection = this.authConnMap.get(teamId)
    // if we have an existing auth connection with QSS for this team and it is active, do nothing
    if (existingAuthConnection != null) {
      if (existingAuthConnection.active) {
        if (!existingAuthConnection.isForClientSocket(currentClientSocket)) {
          this.logger.warn(
            'Existing active auth connection with QSS found for this team ID but it belongs to a previous client socket; closing and replacing',
            teamId
          )
          this.stopConnection(teamId, false)
        } else {
          this.logger.warn('Existing active auth connection with QSS found for this team ID', teamId)
          return
        }
      } else if (!existingAuthConnection.isForClientSocket(currentClientSocket)) {
        this.logger.warn(
          'Existing inactive auth connection with QSS found for this team ID but it belongs to a previous client socket; closing and replacing',
          teamId
        )
        this.stopConnection(teamId, false)
      } else {
        // if we have an existing auth connection with QSS for this team but it is inactive, restart the connection
        this.logger.warn(
          'Existing inactive auth connection with QSS found for this team ID, attempting to start',
          teamId
        )
        await existingAuthConnection.start()
        return
      }
    }

    // create a new auth sync connection with QSS and start it
    const authConnection = await this.moduleRef.create<QSSAuthConnection>(QSSAuthConnection, {
      id: randomInt(1_000_000),
    })
    authConnection.teamId = teamId
    authConnection.on(QSSEvents.QSS_AUTH_CONNECTED, (eventTeamId: string) => {
      if (this.authConnMap.get(teamId) !== authConnection) return
      this.emit(QSSEvents.QSS_AUTH_CONNECTED, eventTeamId ?? teamId)
    })
    authConnection.on(QSSEvents.QSS_AUTH_JOINED, (eventTeamId: string) => {
      if (this.authConnMap.get(teamId) !== authConnection) return
      this.emit(QSSEvents.QSS_AUTH_JOINED, eventTeamId ?? teamId)
    })
    authConnection.on(QSSEvents.QSS_AUTH_ATTEMPT_FAILED, (payload: QSSAuthAttemptFailurePayload) => {
      if (this.authConnMap.get(teamId) !== authConnection) return
      this.emit(QSSEvents.QSS_AUTH_ATTEMPT_FAILED, {
        ...payload,
        teamId: payload.teamId ?? teamId,
      } satisfies QSSAuthAttemptFailurePayload)
    })
    authConnection.on(QSSEvents.QSS_DISCONNECTED, (eventTeamId: string) => {
      if (this.authConnMap.get(teamId) !== authConnection) return
      this.emit(QSSEvents.QSS_DISCONNECTED, eventTeamId ?? teamId)
    })
    authConnection.on(QSSEvents.QSS_SELF_ASSIGN_MEMBER, (eventTeamId: string) => {
      if (this.authConnMap.get(teamId) !== authConnection) return
      this.emit(QSSEvents.QSS_SELF_ASSIGN_MEMBER, eventTeamId ?? teamId)
    })
    this.authConnMap.set(teamId, authConnection)
    await authConnection.start()
  }

  /**
   * Stop an auth sync connection with QSS for a given team
   *
   * @param teamId ID of the team whose auth sync connection we want to stop
   * @param sendDisconnectToQSS If true send a disconnect message to QSS on closure
   */
  public stopConnection(teamId: string, sendDisconnectToQSS = true): void {
    const existingAuthConnection = this.authConnMap.get(teamId)
    if (existingAuthConnection == null) {
      this.logger.warn('No QSS auth connection found for team ID', teamId)
      return
    }
    existingAuthConnection.stop(sendDisconnectToQSS)
    this.authConnMap.delete(teamId)
  }

  /**
   * Close all open auth sync connections with QSS and clear out the local cache of connections
   *
   * @param sendDisconnectToQSS If true send a disconnect message to QSS on closure of each auth sync connection
   */
  public close(sendDisconnectToQSS = false): void {
    this.logger.trace('Closing all QSS auth connections')
    for (const teamId of Array.from(this.authConnMap.keys())) {
      this.logger.info('Closing QSS auth connection for team ID', teamId)
      this.stopConnection(teamId, sendDisconnectToQSS)
    }
    this.authConnMap.clear()
  }
}

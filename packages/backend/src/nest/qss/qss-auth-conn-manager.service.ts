import { Injectable, OnModuleDestroy } from '@nestjs/common'
import { ModuleRef } from '@nestjs/core'
import { randomInt } from 'crypto'
import EventEmitter from 'events'

import { createLogger } from '../common/logger'
import { QSSAuthConnection } from './qss-auth-conn'

@Injectable()
export class QSSAuthConnectionManager extends EventEmitter implements OnModuleDestroy {
  private readonly logger = createLogger('qss:auth:conn:manager')
  private readonly authConnMap: Map<string, QSSAuthConnection> = new Map()

  constructor(private readonly moduleRef: ModuleRef) {
    super()
  }

  public onModuleDestroy() {
    this.close()
  }

  public getConnection(teamId: string): QSSAuthConnection | undefined {
    return this.authConnMap.get(teamId)
  }

  public async startNewConnection(teamId: string): Promise<void> {
    const existingAuthConnection = this.authConnMap.get(teamId)
    if (existingAuthConnection != null) {
      if (existingAuthConnection.active) {
        this.logger.warn('Existing active auth connection with QSS found for this team ID', teamId)
        return
      }

      this.logger.warn('Existing inactive auth connection with QSS found for this team ID, attempting to start', teamId)
      await existingAuthConnection.start()
      return
    }

    const authConnection = await this.moduleRef.create<QSSAuthConnection>(QSSAuthConnection, {
      id: randomInt(1_000_000),
    })
    authConnection.teamId = teamId
    await authConnection.start()
    this.authConnMap.set(teamId, authConnection)
  }

  public stopConnection(teamId: string, sendDisconnectToQSS = true): void {
    const existingAuthConnection = this.authConnMap.get(teamId)
    if (existingAuthConnection == null) {
      this.logger.warn('No QSS auth connection found for team ID', teamId)
      return
    }
    existingAuthConnection.stop(sendDisconnectToQSS)
    this.authConnMap.delete(teamId)
  }

  public close(sendDisconnectToQSS = false): void {
    this.logger.trace('Closing all QSS auth connections')
    for (const teamId of this.authConnMap.keys()) {
      this.logger.info('Closing QSS auth connection for team ID', teamId)
      this.stopConnection(teamId, sendDisconnectToQSS)
    }
    this.authConnMap.clear()
  }
}

import { Injectable } from '@nestjs/common'
import { ModuleRef } from '@nestjs/core'
import EventEmitter from 'events'

import { createLogger } from '../common/logger'
import { QSSAuthConnection } from './qss-auth-conn'

@Injectable()
export class QSSAuthConnectionManager extends EventEmitter {
  private readonly logger = createLogger('qss:auth:conn:manager')
  private readonly authConnMap: Map<string, QSSAuthConnection> = new Map()

  constructor(private readonly moduleRef: ModuleRef) {
    super()
  }

  public getConnection(teamId: string): QSSAuthConnection | undefined {
    return this.authConnMap.get(teamId)
  }

  public async startNewConnection(teamId: string): Promise<void> {
    const existingAuthConnection = this.authConnMap.get(teamId)
    if (existingAuthConnection != null) {
      this.logger.warn('Existing auth connection with QSS found for this team ID, attempting to start', teamId)
      await existingAuthConnection.start()
      return
    }

    const authConnection = await this.moduleRef.resolve<QSSAuthConnection>(QSSAuthConnection)
    authConnection.teamId = teamId
    await authConnection.start()
    this.authConnMap.set(teamId, authConnection)
  }

  public stopConnection(teamId: string, sendPeerDisconnect = true): void {
    const existingAuthConnection = this.authConnMap.get(teamId)
    if (existingAuthConnection == null) {
      this.logger.warn('No QSS auth connection found for team ID', teamId)
      return
    }
    existingAuthConnection.stop(sendPeerDisconnect)
  }

  public close(sendPeerDisconnect = false): void {
    this.logger.warn('Closing all QSS auth connections')
    for (const [teamId, connection] of this.authConnMap.entries()) {
      this.logger.info('Closing QSS auth connection for team ID', teamId)
      connection.stop(sendPeerDisconnect)
    }
  }
}

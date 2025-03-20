import { Server, Team } from '3rd-party/auth/packages/auth/dist'
import { Inject, Injectable } from '@nestjs/common'
import { Community } from '@quiet/types'
import { SigChain } from '../auth/sigchain'
import { createLogger } from '../common/logger'
import { QSS_ENABLED, QSS_ENDPOINT } from '../const'
import { QSSClient } from './qss.client'
import * as uint8arrays from 'uint8arrays'
import { CreateCommunity, CreateCommunityResponse, CreateCommunityStatus, WebsocketEvents } from './qss.types'
import { DateTime } from 'luxon'
import * as url from 'node:url'

@Injectable()
export class QSSService {
  private readonly logger = createLogger(`qss:service`)

  constructor(
    @Inject(QSS_ENABLED) private readonly qssEnabled: boolean,
    @Inject(QSS_ENDPOINT) private readonly qssEndpoint: string,
    private readonly qssClient: QSSClient
  ) {}

  public async connect(): Promise<boolean> {
    if (!this.qssEnabled) {
      this.logger.trace(`Can't connect to QSS because QSS is not initialized`)
      return false
    }

    try {
      this.logger.info(`Establishing connection with QSS`)
      await this.qssClient.createSocket()
      this.logger.info(`Connection established`)
      return true
    } catch (e) {
      this.logger.error(`Error while connecting to QSS`, e)
      return false
    }
  }

  public async createCommunity(community: Community, sigChain: SigChain) {
    if (!this._qssInitialized()) {
      this.logger.trace(`Can't create community on QSS because QSS is not initialized`)
      return false
    }

    if (sigChain.team == null) {
      throw new Error(`Team on this sigchain is nullish!`)
    }

    const serializedSigChain: Uint8Array = sigChain.save()
    const serializedKeyring: Uint8Array = uint8arrays.fromString(
      JSON.stringify((sigChain.team as Team).teamKeyring()),
      'utf8'
    )

    const qssCreateCommunityMessage: CreateCommunity = {
      ts: DateTime.utc().toMillis(),
      payload: {
        community: {
          teamId: (sigChain.team as Team).id,
          psk: community.psk!,
          name: community.name!,
          peerList: community.peerList ?? [],
          sigChain: uint8arrays.toString(serializedSigChain, 'hex'),
        },
        teamKeyring: uint8arrays.toString(serializedKeyring, 'base64'),
      },
    }

    const response = await this.qssClient.sendMessage<CreateCommunityResponse>(
      WebsocketEvents.CreateCommunity,
      qssCreateCommunityMessage,
      true
    )

    if (
      response == null ||
      response.payload.payload == null ||
      response.payload.status !== CreateCommunityStatus.Success
    ) {
      this.logger.error(`Failed to create a community!`, response?.payload.reason ?? 'Response was nullish')
      return undefined
    }

    const lfaServer: Server = {
      host: url.parse(this.qssEndpoint).host!,
      keys: response.payload.payload.serverKeys,
    }

    this.logger.info(`Got a valid response from QSS, adding it to the chain`)
    sigChain.server.addServer(lfaServer)
  }

  private _qssInitialized(): boolean {
    if (!this.qssEnabled || this.qssEndpoint == null) {
      this.logger.trace(`QSS is not enabled!`)
      return false
    }

    return !!this.qssClient.clientSocket?.connected
  }
}

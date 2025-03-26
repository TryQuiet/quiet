import { Inject, Injectable } from '@nestjs/common'
import type { CryptoKX, KeyPair } from 'libsodium-wrappers-sumo'
import { connect, type Socket as ClientSocket } from 'socket.io-client'
import { DateTime } from 'luxon'

import { createLogger } from '../common/logger'
import { QSS_ENABLED, QSS_ENDPOINT } from '../const'
import { QSSKXEncryptionService } from './encryption/qss-enc.service'
import {
  HandshakeMessage,
  HandshakeStatus,
  QSSConnectionError,
  QSSHandshakeError,
  QSSNotInitializedError,
  WebsocketEvents,
} from './qss.types'
import { sleep } from '../common/sleep'
import { CLIENT_TRANSPORTS } from './qss.const'

@Injectable()
export class QSSClient {
  public clientSocket: ClientSocket | undefined = undefined
  private keyPair: KeyPair | undefined = undefined
  private sessionKey: CryptoKX | undefined = undefined

  private readonly logger = createLogger(`qss:client`)

  constructor(
    @Inject(QSS_ENABLED) private readonly qssEnabled: boolean,
    @Inject(QSS_ENDPOINT) private readonly qssEndpoint: string,
    private readonly qssKxEncryptionService: QSSKXEncryptionService
  ) {
    this.logger.warn(this.qssEnabled)
    this.logger.warn(this.qssEndpoint)
    if (this.qssEnabled && this.qssEndpoint != null) {
      this.logger.trace('QSS enabled!')
    }
  }

  public async createSocket(): Promise<ClientSocket> {
    if (!this.qssEnabled || this.qssEndpoint == null) {
      throw new QSSNotInitializedError(`QSS is not enabled`)
    }

    this.logger.info(`Creating client socket`)

    this.keyPair = this.qssKxEncryptionService.generateKeyPair()
    this.clientSocket = connect(this.qssEndpoint, {
      autoConnect: false,
      forceNew: true,
      transports: CLIENT_TRANSPORTS,
      auth: {
        publicKey: this.qssKxEncryptionService.sodiumHelper.toBase64(this.keyPair.publicKey),
      },
    })
    await this._waitForConnect()

    return this.clientSocket
  }

  private async _waitForConnect(): Promise<void> {
    if (this.clientSocket == null || this.keyPair == null) {
      throw new QSSNotInitializedError(`Must run createSocket first!`)
    }

    this.clientSocket.on(
      WebsocketEvents.HANDSHAKE,
      (handshake: HandshakeMessage, callback: (...args: unknown[]) => void) => {
        if (handshake.payload.status === HandshakeStatus.ERROR) {
          throw new QSSHandshakeError(handshake.payload.reason ?? `Unknown error`)
        }

        if (handshake.payload.payload == null) {
          throw new QSSHandshakeError(`Payload was empty`)
        }

        this.sessionKey = this.qssKxEncryptionService.generateSharedSessionKeyPair(
          this.keyPair!,
          this.qssKxEncryptionService.sodiumHelper.fromBase64(handshake.payload.payload.publicKey)
        )
        callback({
          ts: DateTime.utc().toMillis(),
          payload: { status: HandshakeStatus.SUCCESS },
        })
      }
    )

    this.clientSocket.connect()
    let count = 20
    while (!this.clientSocket.connected) {
      if (count < 0) {
        throw new QSSConnectionError(`Client didn't connect in time!`)
      }

      this.logger.debug(`Waiting for client to finish connecting...`)
      await sleep(500)
      count--
    }
  }

  public async sendMessage<T>(event: WebsocketEvents, payload: unknown, withAck = false): Promise<T | undefined> {
    this.logger.debug(`Sending message`, event)
    if (this.clientSocket == null || this.sessionKey == null) {
      throw new QSSNotInitializedError(`Must run createSocket first!`)
    }

    const encryptedPayload = this.encryptPayload(payload)
    if (withAck) {
      const encryptedResponse = (await this.clientSocket.emitWithAck(event, encryptedPayload)) as string
      return this.decryptPayload(encryptedResponse) as T
    }

    this.clientSocket.emit(event, encryptedPayload)
    return undefined
  }

  public encryptPayload(payload: unknown): string {
    if (this.clientSocket == null || this.sessionKey == null) {
      throw new QSSNotInitializedError(`Must run createSocket first!`)
    }

    return this.qssKxEncryptionService.encrypt(payload, this.sessionKey)
  }

  public decryptPayload(encryptedPayload: string): unknown {
    if (this.clientSocket == null || this.sessionKey == null) {
      throw new QSSNotInitializedError(`Must run createSocket first!`)
    }

    return this.qssKxEncryptionService.decrypt(encryptedPayload, this.sessionKey)
  }

  public close(): void {
    if (this.clientSocket == null) {
      this.logger.warn(`Client socket wasn't open!`)
      return
    }

    this.logger.info(`Closing client socket`)
    this.clientSocket.close()
  }
}

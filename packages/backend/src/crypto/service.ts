import express from 'express'
import { createServer, Server } from 'http'
import SocketIO from 'socket.io'
import { EventEmitter } from 'events'
import cors from 'cors'

import { CryptoServicePayload, CryptoServiceResponse, SocketActionTypes } from '@quiet/state-manager'

// eslint-disable-next-line
const socketio = require('socket.io')

export class CryptoService extends EventEmitter {
  public PORT: number
  private readonly _app: express.Application
  private readonly server: Server
  public io: SocketIO.Server
  constructor(port: number) {
    super()
    this.PORT = port
    this._app = express()
    this._app.use(cors())
    this.server = createServer(this._app)
    this.initSocket()
  }

  private get cors() {
    if (process.env.TEST_MODE === 'true' && process.env.E2E_TEST === 'true') {
      return {
        origin: '*',
        methods: ['GET', 'POST']
      }
    }
    return false
  }

  private readonly initSocket = (): void => {
    this.io = socketio(this.server, {
      cors: this.cors,
      pingInterval: 1000_000,
      pingTimeout: 1000_000
    })
    this.io.on(SocketActionTypes.CRYPTO_SERVICE_CALL, (payload: CryptoServicePayload) => {
      this.emit(SocketActionTypes.CRYPTO_SERVICE_CALL, payload)
    })
  }

  public sendResponse = (payload: CryptoServiceResponse) => {
    this.io.emit(SocketActionTypes.CRYPTO_SERVICE_RESPONSE, payload)
  }
}

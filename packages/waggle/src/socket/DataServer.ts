import express from 'express'
import { createServer, Server } from 'http'
// eslint-disable-next-line
const socketio = require('socket.io')

export class DataServer {
  public PORT: number
  private readonly _app: express.Application
  private readonly server: Server
  public io: SocketIO.Server
  constructor(port?: number) {
    this.PORT = port || 4677
    this._app = express()
    this.server = createServer(this._app)
    this.initSocket()
  }

  private readonly initSocket = (): void => {
    this.io = socketio(this.server)
  }

  public listen = async (): Promise<void> => {
    return await new Promise((resolve) => {
      this.server.listen(this.PORT, () => {
        console.debug(`Server running on port ${this.PORT}`)
        resolve()
      })
    })
  }

  public close = async (): Promise<void> => {
    return await new Promise((resolve) => {
      this.server.close()
      resolve()
    })
  }
}

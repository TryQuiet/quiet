import { Module } from '@nestjs/common'
import { SocketService } from './socket.service'
import express from 'express'
import { createServer } from 'http'
import { Server as SocketIO } from 'socket.io'
import { EXPRESS_PROVIDER, SERVER_IO_PROVIDER } from '../const'

// const serverIoProvider = {
//   provide: SERVER_IO_PROVIDER,
//   useFactory: (expressProvider: express.Application) => {
//     const _app = expressProvider
//     // _app.use(cors())
//     const server = createServer(_app)
//    const io = new SocketIO(server, {
//       // cors: this.cors,
//       pingInterval: 1000_000,
//       pingTimeout: 1000_000
//     })

//     return { server, io }
//   },
//   inject: [EXPRESS_PROVIDER],

// }

@Module({
  providers: [SocketService],
  exports: [SocketService]
})
export class SocketModule {}

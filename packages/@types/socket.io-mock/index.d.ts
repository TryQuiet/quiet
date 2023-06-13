declare module 'socket.io-mock' {
  class SocketClient {
    constructor()
    emit: <T>(eventName: string, ...args: T[]) => void
  }
  export default class MockedSocket {
    constructor()
    socketClient: SocketClient
    emit: (...args: any[]) => void
  }
}

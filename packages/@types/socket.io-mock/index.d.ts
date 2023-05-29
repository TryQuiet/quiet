declare module 'socket.io-mock' {
  export default class MockedSocket {
    constructor()
    socketClient: any
    emit: (...args: any[]) => void
  }
}

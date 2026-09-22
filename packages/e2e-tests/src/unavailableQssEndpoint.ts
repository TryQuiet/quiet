import net from 'net'

/** Reserve a test-owned endpoint that rejects every QSS connection attempt. */
export async function unavailableQssEndpoint(): Promise<{
  url: string
  readonly connectionCount: number
  close: () => Promise<void>
}> {
  let connectionCount = 0
  const server = net.createServer(socket => {
    connectionCount += 1
    socket.destroy()
  })
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject)
    server.listen(0, '127.0.0.1', () => {
      server.removeListener('error', reject)
      resolve()
    })
  })
  const { port } = server.address() as net.AddressInfo
  return {
    url: `ws://127.0.0.1:${port}`,
    // A rejected connection is the only local evidence that the client actually
    // tried QSS, so admission tests assert this rather than the absence of a log.
    get connectionCount() {
      return connectionCount
    },
    close: () => new Promise<void>(resolve => server.close(() => resolve())),
  }
}

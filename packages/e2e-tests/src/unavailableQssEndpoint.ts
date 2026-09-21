import net from 'net'

/** Reserve a test-owned endpoint that rejects every QSS connection attempt. */
export async function unavailableQssEndpoint(): Promise<{ url: string; close: () => Promise<void> }> {
  const server = net.createServer(socket => socket.destroy())
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
    close: () => new Promise<void>(resolve => server.close(() => resolve())),
  }
}

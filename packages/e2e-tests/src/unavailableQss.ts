import net from 'net'

/** Own the endpoint for the entire test, rejecting every connection. A guessed
 * unused port can belong to a real QSS stack or be claimed between retries. */
export async function startUnavailableQss(): Promise<{
  endpoint: string
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
      server.off('error', reject)
      resolve()
    })
  })
  const { port } = server.address() as net.AddressInfo
  return {
    endpoint: `ws://127.0.0.1:${port}`,
    get connectionCount() {
      return connectionCount
    },
    close: async () => {
      await new Promise<void>((resolve, reject) => {
        server.close(error => (error ? reject(error) : resolve()))
      })
    },
  }
}

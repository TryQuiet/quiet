import { formatPEM } from '@quiet/identity'
import { type Certificate } from 'pkijs'
import io from 'socket.io-client'
import { type ConnectionsManager } from './connectionsManager'

export function dumpPEM(tag: string, body: string | Certificate | CryptoKey) {
  let bodyCert: string
  if (typeof body === 'string') {
    bodyCert = formatPEM(body)
  } else {
    // eslint-disable-next-line @typescript-eslint/prefer-ts-expect-error
    // @ts-ignore
    bodyCert = formatPEM(Buffer.from(body).toString('base64'))
  }
  const result = (
    `-----BEGIN ${tag}-----\n` +
    `${bodyCert}\n` +
    `-----END ${tag}-----\n`
  )
  return Buffer.from(result)
}

export async function initConnectionsManagerWithTor (connectionsManager: ConnectionsManager, port: number) {
  const url = `http://localhost:${port}`
  const socket = io(url)

 const init = new Promise<void>(resolve => {
  void connectionsManager.init()
  socket.connect()
    setTimeout(() => { resolve() }, 200)
  })

  await init

  return socket
}

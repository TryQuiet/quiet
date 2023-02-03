import createHttpsProxyAgent from 'https-proxy-agent'
import fetch, { Response } from 'node-fetch'
import PeerId from 'peer-id'
import { createLibp2p } from '../common/testUtils'
import { Storage } from '../storage'

export async function registerUser(csr: string, httpTunnelPort: number, localhost: boolean = true, registrarPort: number = 7789): Promise<Response> {
  let address = '127.0.0.1'
  let options = {
    method: 'POST',
    body: JSON.stringify({ data: csr }),
    headers: { 'Content-Type': 'application/json' }
  }
  if (!localhost) {
    options = Object.assign(options, { agent: createHttpsProxyAgent({ port: httpTunnelPort, host: 'localhost', timeout: 100000 }) })
    address = '4avghtoehep5ebjngfqk5b43jolkiyyedfcvvq4ouzdnughodzoglzad.onion'
    return await fetch(`http://${address}/register`, options)
  }
  return await fetch(`http://${address}:${registrarPort}/register`, options)
}

export const getStorage = async (quietDir: string) => {
  const peerId = await PeerId.create()
  const storage = new Storage(
    quietDir,
    'communityid',
    {
      ...{},
      orbitDbDir: `OrbitDB${peerId.toB58String()}`,
      ipfsDir: `Ipfs${peerId.toB58String()}`
    }
  )
  await storage.init(await createLibp2p(peerId), peerId)
  await storage.initDatabases()
  return storage
}

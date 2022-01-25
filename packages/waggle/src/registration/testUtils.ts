import { PermsData } from '@quiet/nectar'
import { HttpsProxyAgent } from 'https-proxy-agent'
import fetch, { Response } from 'node-fetch'
import PeerId from 'peer-id'
import { CertificateRegistration } from '.'
import { createLibp2p, createMinConnectionManager } from '../common/testUtils'
import { Storage } from '../storage'
import { Tor } from '../torManager'

export async function registerUser(csr: string, httpTunnelPort: number, localhost: boolean = true, registrarPort: number = 7789): Promise<Response> {
  let address = '127.0.0.1'
  let options = {
    method: 'POST',
    body: JSON.stringify({ data: csr }),
    headers: { 'Content-Type': 'application/json' }
  }
  if (!localhost) {
    options = Object.assign(options, { agent: new HttpsProxyAgent({ port: httpTunnelPort, host: 'localhost', timeout: 100000 }) })
    address = '4avghtoehep5ebjngfqk5b43jolkiyyedfcvvq4ouzdnughodzoglzad.onion'
    return await fetch(`http://${address}/register`, options)
  }
  return await fetch(`http://${address}:${registrarPort}/register`, options)
}

export async function setupRegistrar(tor: Tor, storage: Storage, permsData: PermsData, hiddenServiceKey?: string, port?: number) {
  const certRegister = new CertificateRegistration(
    tor,
    storage,
    permsData,
    hiddenServiceKey,
    port
  )
  try {
    await certRegister.init()
  } catch (err) {
    console.error(`Couldn't initialize certificate registration service: ${err as string}`)
    return
  }
  try {
    await certRegister.listen()
  } catch (err) {
    console.error(`Certificate registration service couldn't start listening: ${err as string}`)
  }
  return certRegister
}

export const getStorage = async (zbayDir: string) => {
  const peerId = await PeerId.create()
  const connectionsManager = createMinConnectionManager({ env: { appDataPath: zbayDir }, torControlPort: 12345 })
  const storage = new Storage(
    zbayDir,
    connectionsManager.ioProxy,
    'communityid',
    {
      ...{},
      orbitDbDir: `OrbitDB${peerId.toB58String()}`,
      ipfsDir: `Ipfs${peerId.toB58String()}`
    }
  )
  await storage.init(await createLibp2p(peerId), peerId)
  return storage
}

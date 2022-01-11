// import { createMinConnectionManager, createTmpDir, tmpZbayDirPath } from '../common/testUtils'
// import { getPorts } from '../common/utils'
// import { createCertificatesTestHelper } from '../libp2p/tests/client-server'
// import { CertificateRegistration } from '../registration'
// import { Storage } from '../storage'
// import IOProxy from './IOProxy'
jest.setTimeout(100_000)

// test('IO proxy closes all services (using tor)', async () => {
//   const pems = await createCertificatesTestHelper('adres1.onion', 'adres2.onion')
//   const certs1 = {
//     cert: pems.servCert,
//     key: pems.servKey,
//     ca: [pems.ca]
//   }
//   const certs2 = {
//     cert: pems.userCert,
//     key: pems.userKey,
//     ca: [pems.ca]
//   }
//   const appDataPath = createTmpDir()
//   const ports = await getPorts()
//   const manager = createMinConnectionManager({
//     env: { appDataPath: tmpZbayDirPath(appDataPath.name) },
//     torControlPort: ports.controlPort
//   })
//   await manager.init()
//   const ioProxy = new IOProxy(manager)
//   await ioProxy.createCommunity('myCommunity1', certs1, pems.ca, pems.ca_key)
//   await ioProxy.createCommunity('myCommunity2', certs2)
//   const spyTorKill = jest.spyOn(manager.tor, 'kill')
//   const spyOnIo = jest.spyOn(manager.io, 'close')
//   const spyOnRegistrarStop = jest.spyOn(CertificateRegistration.prototype, 'stop')
//   const spyOnStorageStop = jest.spyOn(Storage.prototype, 'stopOrbitDb')
//   await ioProxy.closeAll()
//   expect(spyTorKill).toBeCalledTimes(1)
//   expect(spyOnRegistrarStop).toBeCalledTimes(1)
//   expect(spyOnStorageStop).toBeCalledTimes(2)
//   expect(spyOnIo).toBeCalledTimes(1)
// })

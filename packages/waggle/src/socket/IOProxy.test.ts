import { ConnectionsManager } from '../libp2p/connectionsManager'
import { createCertificatesTestHelper } from '../libp2p/tests/client-server'
import { CertificateRegistration } from '../registration'
import { Storage } from '../storage'
import { createMinConnectionManager, createTmpDir, ResponseMock, tmpZbayDirPath, TorMock } from '../testUtils'
import { getPorts } from '../utils'
import { EventTypesResponse } from './constantsReponse'
import IOProxy from './IOProxy'

describe('IO proxy', () => {
  let manager: ConnectionsManager
  let ioProxy: IOProxy

  beforeEach(async () => {
    jest.clearAllMocks()
    const appDataPath = createTmpDir()
    const ports = await getPorts()
    manager = createMinConnectionManager({
      env: { appDataPath: tmpZbayDirPath(appDataPath.name) },
      torControlPort: ports.controlPort
    })
    const torInitMock = jest.fn(async () => {
      // @ts-expect-error
      manager.tor = new TorMock()
    })
    manager.init = torInitMock
    await manager.init()
    ioProxy = new IOProxy(manager)
  })

  afterEach(async () => {
    await ioProxy.communities.closeStorages()
    await ioProxy.communities.stopRegistrars()
    await manager.tor.kill()
  })

  it('creates community without running registrar for regular user', async () => {
    const observedLaunchRegistrar = jest.spyOn(ioProxy, 'launchRegistrar')
    const observedIO = jest.spyOn(ioProxy.io, 'emit')
    const observedCommunityCreate = jest.spyOn(ioProxy.communities, 'create')
    const pems = await createCertificatesTestHelper('adres1.onion', 'adres2.onion')
    const certs = {
      cert: pems.userCert,
      key: pems.userKey,
      ca: [pems.ca]
    }
    await ioProxy.createCommunity('MyCommunity', certs)
    expect(observedLaunchRegistrar).not.toBeCalled()
    const communityData = await observedCommunityCreate.mock.results[0].value
    expect(observedIO).lastCalledWith(EventTypesResponse.NEW_COMMUNITY, { id: 'MyCommunity', payload: communityData })
  })

  it('creates community and starts registrar if user is the owner', async () => {
    const communityId = 'MyCommunity'
    const observedLaunchRegistrar = jest.spyOn(ioProxy, 'launchRegistrar')
    const observedIO = jest.spyOn(ioProxy.io, 'emit')
    const observedCommunityCreate = jest.spyOn(ioProxy.communities, 'create')
    const pems = await createCertificatesTestHelper('adres1.onion', 'adres2.onion')
    const certs = {
      cert: pems.userCert,
      key: pems.userKey,
      ca: [pems.ca]
    }
    await ioProxy.createCommunity(communityId, certs, 'ownerRootCert', 'ownerRootKey')
    expect(observedLaunchRegistrar).toBeCalled()
    const communityData = await observedCommunityCreate.mock.results[0].value
    expect(observedIO).lastCalledWith(EventTypesResponse.NEW_COMMUNITY, { id: communityId, payload: communityData })
  })

  it('emits error if connecting to registrar fails', async () => {
    const observedIO = jest.spyOn(ioProxy.io, 'emit')
    await ioProxy.registerUserCertificate('improperServiceAddress.onion', 'userCsr', 'someCommunityId')
    expect(observedIO).toBeCalledTimes(1)
    expect(observedIO).toBeCalledWith(EventTypesResponse.ERROR, { type: EventTypesResponse.REGISTRAR, message: 'Connecting to registrar failed', communityId: 'someCommunityId', code: 500 })
  })

  it.each([
    ['Username already taken.', 403, 403],
    ['Username is not valid', 403, 400],
    ['Registering username failed.', 500, 500]
  ])('emits error "%s" with code %s if registrar returns %s', async (socketMessage: string, socketStatusCode: number, registrarStatusCode: number) => {
    const observedIO = jest.spyOn(ioProxy.io, 'emit')
    const mockRegisterCertificate = jest.fn()
    ioProxy.connectionsManager.sendCertificateRegistrationRequest = mockRegisterCertificate
    mockRegisterCertificate.mockReturnValue(Promise.resolve(new ResponseMock().init(registrarStatusCode)))
    await ioProxy.registerUserCertificate('http://properAddress.onion', 'userCsr', 'someCommunityId')
    expect(observedIO).toBeCalledTimes(1)
    expect(observedIO).toBeCalledWith(EventTypesResponse.ERROR, { type: EventTypesResponse.REGISTRAR, message: socketMessage, communityId: 'someCommunityId', code: socketStatusCode })
  })

  it('sends user certificate after successful registration', async () => {
    const registrarResponse = {
      certificate: 'userCertificate',
      peers: ['peer1', 'peer2']
    }
    const observedIO = jest.spyOn(ioProxy.io, 'emit')
    const mockRegisterCertificate = jest.fn()
    ioProxy.connectionsManager.sendCertificateRegistrationRequest = mockRegisterCertificate
    mockRegisterCertificate.mockReturnValue(Promise.resolve(new ResponseMock().init(200, registrarResponse)))
    await ioProxy.registerUserCertificate('http://properAddress.onion', 'userCsr', 'someCommunityId')
    expect(observedIO).toBeCalledTimes(1)
    expect(observedIO).toBeCalledWith(EventTypesResponse.SEND_USER_CERTIFICATE, { id: 'someCommunityId', payload: registrarResponse })
  })
})

test('IO proxy closes all services', async () => {
  const pems = await createCertificatesTestHelper('adres1.onion', 'adres2.onion')
  const certs1 = {
    cert: pems.servCert,
    key: pems.servKey,
    ca: [pems.ca]
  }
  const certs2 = {
    cert: pems.userCert,
    key: pems.userKey,
    ca: [pems.ca]
  }
  const appDataPath = createTmpDir()
  const ports = await getPorts()
  const manager = createMinConnectionManager({
    env: { appDataPath: tmpZbayDirPath(appDataPath.name) },
    torControlPort: ports.controlPort
  })
  await manager.init()
  const ioProxy = new IOProxy(manager)
  await ioProxy.createCommunity('myCommunity1', certs1, pems.ca, pems.ca_key)
  await ioProxy.createCommunity('myCommunity2', certs2)
  const spyTorKill = jest.spyOn(manager.tor, 'kill')
  const spyOnIo = jest.spyOn(manager.io, 'close')
  const spyOnRegistrarStop = jest.spyOn(CertificateRegistration.prototype, 'stop')
  const spyOnStorageStop = jest.spyOn(Storage.prototype, 'stopOrbitDb')
  await ioProxy.closeAll()
  expect(spyTorKill).toBeCalledTimes(1)
  expect(spyOnRegistrarStop).toBeCalledTimes(1)
  expect(spyOnStorageStop).toBeCalledTimes(2)
  expect(spyOnIo).toBeCalledTimes(1)
})

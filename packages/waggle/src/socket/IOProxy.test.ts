import {
  createMinConnectionManager,
  createTmpDir,
  ResponseMock,
  tmpZbayDirPath,
  TorMock
} from '../common/testUtils'
import { getPorts } from '../common/utils'
import { ConnectionsManager } from '../libp2p/connectionsManager'
import { createCertificatesTestHelper } from '../libp2p/tests/client-server'
import {
  Certificates,
  HiddenService,
  InitCommunityPayload,
  LaunchRegistrarPayload,
  RegisterUserCertificatePayload,
  SocketActionTypes
  , ErrorCodes, ErrorMessages
} from '@zbayapp/nectar'
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
    const observedCommunityCreate = jest.spyOn(ioProxy.communities, 'launch')

    const peerId1 = {
      id: 'QmWVMaUqEB73gzgGkc9wS7rnhNcpSyH64dmbGUdU2TM3eV',
      privKey:
        'CAASqAkwggSkAgEAAoIBAQCY2r7s5YlgWXlHuHH4PY/cUik/m7GuWPdTPmmm4QZTr1VSyKgC2AMR45xrcGMjd5SDh1HjzbptJpYfGWO+Sbm6yK7EfxYN8gOXrbo0koKtPH0hrgzus+CqUCAQDE6XWzY5yP7caFt/RolZaBYNcKCWDCHv+bg/87u3MGwwSeaMjYWNAQ5IVWrUFnns8eiyNRhBGrEQZDTyO4X0oMeEkTTABMEJIpge91SWfuYuqltiNdkS9aiYS58F43IBHKKWLc39b3KbiykiG2IjrqVl2aAyb6vSgtiGkwi301jtWEctaDl2JbwZpgldOA83wH2aBPK9N9MaakEYdI2dHVSg8bf9AgMBAAECggEAOH8JeIfyecE4WXDr9wPSC232vwLt7nIFoCf+ZubfLskscTenGb37jH4jT3avvekx5Fd8xgVBNZzAeegpfKjFVCtepVQPs8HS4BofK9VHJX6pBWzObN/hVzHcV/Ikjj7xUPRgdti/kNBibcBR/k+1myAK3ybemgydQj1Mj6CQ7Tu/4npaRXhVygasbTgFCYxrV+CGjzITdCAdRTWg1+H6puxjfObZqj0wa4I6sCom0+Eau7nULtVmi0hodOwKwtmc2oaUyCQY2yiEjdZnkXEEhP1EtJka+kD96iAG3YvFqlcdUPYVlIxCP9h55AaOShnACNymiTpYzpCP/kUK9wFkZQKBgQD2wjjWEmg8DzkD3y19MVZ71w0kt0PgZMU+alR8EZCJGqvoyi2wcinfdmqyOZBf2rct+3IyVpwuWPjsHOHq7ZaJGmJkTGrNbndTQ+WgwJDvghqBfHFrgBQNXvqHl5EuqnRMCjrJeP8Uud1su5zJbHQGsycZwPzB3fSj0yAyRO812wKBgQCelDmknQFCkgwIFwqqdClUyeOhC03PY0RGngp+sLlu8Q8iyEI1E9i/jTkjPpioAZ/ub5iD6iP5gj27N239B/elZY5xQQeDA4Ns+4yNOTx+nYXmWcTfVINFVe5AK824TjqlCY2ES+/hVBKB+JQV6ILlcCj5dXz9cCbg6cys4TttBwKBgH+rdaSs2WlZpvIt4mdHw6tHVPGOMHxFJxhoA1Y98D4/onpLQOBt8ORBbGrSBbTSgLw1wJvy29PPDNt9BhZ63swI7qdeMlQft3VJR+GoQFTrR7N/I1+vYLCaV50X+nHel1VQZaIgDDo5ACtl1nUQu+dLggt9IklcAVtRvPLFX87JAoGBAIBl8+ZdWc/VAPjr7y7krzJ/5VdYF8B716R2AnliDkLN3DuFelYPo8g1SLZI0MH3zs74fL0Sr94unl0gHGZsNRAuko8Q4EwsZBWx97PBTEIYuXox5T4O59sUILzEuuUoMkO+4F7mPWxs7i9eXkj+4j1z+zlA79slG9WweJDiLYOxAoGBAMmH/nv1+0sUIL2qgE7OBs8kokUwx4P8ZRAlL6ZVC4tVuDBL0zbjJKcQWOcpWQs9pC6O/hgPur3VgHDF7gko3ZDB0KuxVJPZyIhoo+PqXaCeq4KuIPESjYKT803p2S76n/c2kUaQ5i2lYToClvhk72kw9o9niSyVdotXxC90abI9',
      pubKey:
        'CAASpgIwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQCY2r7s5YlgWXlHuHH4PY/cUik/m7GuWPdTPmmm4QZTr1VSyKgC2AMR45xrcGMjd5SDh1HjzbptJpYfGWO+Sbm6yK7EfxYN8gOXrbo0koKtPH0hrgzus+CqUCAQDE6XWzY5yP7caFt/RolZaBYNcKCWDCHv+bg/87u3MGwwSeaMjYWNAQ5IVWrUFnns8eiyNRhBGrEQZDTyO4X0oMeEkTTABMEJIpge91SWfuYuqltiNdkS9aiYS58F43IBHKKWLc39b3KbiykiG2IjrqVl2aAyb6vSgtiGkwi301jtWEctaDl2JbwZpgldOA83wH2aBPK9N9MaakEYdI2dHVSg8bf9AgMBAAE='
    }

    const hiddenService1: HiddenService = {
      onionAddress: 'u2rg2direy34dj77375h2fbhsc2tvxj752h4tlso64mjnlevcv54oaad.onion',
      privateKey:
        'ED25519-V3:uCr5t3EcOCwig4cu7pWY6996whV+evrRlI0iIIsjV3uCz4rx46sB3CPq8lXEWhjGl2jlyreomORirKcz9mmcdQ=='
    }

    const pems = await createCertificatesTestHelper('adres1.onion', hiddenService1.onionAddress)

    const certs: Certificates = {
      certificate: pems.userCert,
      key: pems.userKey,
      CA: [pems.ca]
    }

    const createCommunityPayload: InitCommunityPayload = {
      id: 'MyCommunity',
      peerId: peerId1,
      hiddenService: hiddenService1,
      certs: certs,
      peers: []
    }

    await ioProxy.createCommunity(createCommunityPayload)
    expect(observedLaunchRegistrar).not.toBeCalled()
    const communityData = await observedCommunityCreate.mock.results[0].value
    console.log(communityData)
    expect(observedIO).lastCalledWith(SocketActionTypes.NEW_COMMUNITY, { id: 'MyCommunity' })
  })

  it('starts registrar', async () => {
    const communityId = 'MyCommunity'
    const observedLaunchRegistrar = jest.spyOn(ioProxy, 'launchRegistrar')
    const observedIO = jest.spyOn(ioProxy.io, 'emit')
    const peerId = {
      id: 'QmWVMaUqEB73gzgGkc9wS7rnhNcpSyH64dmbGUdU2TM3eV',
      privKey:
        'CAASqAkwggSkAgEAAoIBAQCY2r7s5YlgWXlHuHH4PY/cUik/m7GuWPdTPmmm4QZTr1VSyKgC2AMR45xrcGMjd5SDh1HjzbptJpYfGWO+Sbm6yK7EfxYN8gOXrbo0koKtPH0hrgzus+CqUCAQDE6XWzY5yP7caFt/RolZaBYNcKCWDCHv+bg/87u3MGwwSeaMjYWNAQ5IVWrUFnns8eiyNRhBGrEQZDTyO4X0oMeEkTTABMEJIpge91SWfuYuqltiNdkS9aiYS58F43IBHKKWLc39b3KbiykiG2IjrqVl2aAyb6vSgtiGkwi301jtWEctaDl2JbwZpgldOA83wH2aBPK9N9MaakEYdI2dHVSg8bf9AgMBAAECggEAOH8JeIfyecE4WXDr9wPSC232vwLt7nIFoCf+ZubfLskscTenGb37jH4jT3avvekx5Fd8xgVBNZzAeegpfKjFVCtepVQPs8HS4BofK9VHJX6pBWzObN/hVzHcV/Ikjj7xUPRgdti/kNBibcBR/k+1myAK3ybemgydQj1Mj6CQ7Tu/4npaRXhVygasbTgFCYxrV+CGjzITdCAdRTWg1+H6puxjfObZqj0wa4I6sCom0+Eau7nULtVmi0hodOwKwtmc2oaUyCQY2yiEjdZnkXEEhP1EtJka+kD96iAG3YvFqlcdUPYVlIxCP9h55AaOShnACNymiTpYzpCP/kUK9wFkZQKBgQD2wjjWEmg8DzkD3y19MVZ71w0kt0PgZMU+alR8EZCJGqvoyi2wcinfdmqyOZBf2rct+3IyVpwuWPjsHOHq7ZaJGmJkTGrNbndTQ+WgwJDvghqBfHFrgBQNXvqHl5EuqnRMCjrJeP8Uud1su5zJbHQGsycZwPzB3fSj0yAyRO812wKBgQCelDmknQFCkgwIFwqqdClUyeOhC03PY0RGngp+sLlu8Q8iyEI1E9i/jTkjPpioAZ/ub5iD6iP5gj27N239B/elZY5xQQeDA4Ns+4yNOTx+nYXmWcTfVINFVe5AK824TjqlCY2ES+/hVBKB+JQV6ILlcCj5dXz9cCbg6cys4TttBwKBgH+rdaSs2WlZpvIt4mdHw6tHVPGOMHxFJxhoA1Y98D4/onpLQOBt8ORBbGrSBbTSgLw1wJvy29PPDNt9BhZ63swI7qdeMlQft3VJR+GoQFTrR7N/I1+vYLCaV50X+nHel1VQZaIgDDo5ACtl1nUQu+dLggt9IklcAVtRvPLFX87JAoGBAIBl8+ZdWc/VAPjr7y7krzJ/5VdYF8B716R2AnliDkLN3DuFelYPo8g1SLZI0MH3zs74fL0Sr94unl0gHGZsNRAuko8Q4EwsZBWx97PBTEIYuXox5T4O59sUILzEuuUoMkO+4F7mPWxs7i9eXkj+4j1z+zlA79slG9WweJDiLYOxAoGBAMmH/nv1+0sUIL2qgE7OBs8kokUwx4P8ZRAlL6ZVC4tVuDBL0zbjJKcQWOcpWQs9pC6O/hgPur3VgHDF7gko3ZDB0KuxVJPZyIhoo+PqXaCeq4KuIPESjYKT803p2S76n/c2kUaQ5i2lYToClvhk72kw9o9niSyVdotXxC90abI9',
      pubKey:
        'CAASpgIwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQCY2r7s5YlgWXlHuHH4PY/cUik/m7GuWPdTPmmm4QZTr1VSyKgC2AMR45xrcGMjd5SDh1HjzbptJpYfGWO+Sbm6yK7EfxYN8gOXrbo0koKtPH0hrgzus+CqUCAQDE6XWzY5yP7caFt/RolZaBYNcKCWDCHv+bg/87u3MGwwSeaMjYWNAQ5IVWrUFnns8eiyNRhBGrEQZDTyO4X0oMeEkTTABMEJIpge91SWfuYuqltiNdkS9aiYS58F43IBHKKWLc39b3KbiykiG2IjrqVl2aAyb6vSgtiGkwi301jtWEctaDl2JbwZpgldOA83wH2aBPK9N9MaakEYdI2dHVSg8bf9AgMBAAE='
    }

    const hiddenService: HiddenService = {
      onionAddress: 'u2rg2direy34dj77375h2fbhsc2tvxj752h4tlso64mjnlevcv54oaad.onion',
      privateKey:
        'ED25519-V3:uCr5t3EcOCwig4cu7pWY6996whV+evrRlI0iIIsjV3uCz4rx46sB3CPq8lXEWhjGl2jlyreomORirKcz9mmcdQ=='
    }

    const pems = await createCertificatesTestHelper(hiddenService.onionAddress, 'adres2.onion')

    const certs: Certificates = {
      certificate: pems.userCert,
      key: pems.userKey,
      CA: [pems.ca]
    }

    const launchCommunityPayload: InitCommunityPayload = {
      id: 'MyCommunity',
      peerId: peerId,
      hiddenService: hiddenService,
      certs: certs,
      peers: []
    }

    const launchRegistrarPayload: LaunchRegistrarPayload = {
      id: 'MyCommunity',
      peerId: peerId.id,
      rootCertString: pems.ca,
      rootKeyString: pems.ca_key,
      privateKey: hiddenService.privateKey,
      port: 1234
    }

    await ioProxy.launchCommunity(launchCommunityPayload)
    await ioProxy.launchRegistrar(launchRegistrarPayload)

    expect(observedLaunchRegistrar).toBeCalled()

    expect(observedIO).lastCalledWith(SocketActionTypes.REGISTRAR, {
      id: communityId,
      payload: {
        onionAddress: 'mockedOnionAddress',
        privateKey:
          'ED25519-V3:uCr5t3EcOCwig4cu7pWY6996whV+evrRlI0iIIsjV3uCz4rx46sB3CPq8lXEWhjGl2jlyreomORirKcz9mmcdQ=='
      },
      peerId: peerId.id
    })
  })

  it('emits error if connecting to registrar fails', async () => {
    const observedIO = jest.spyOn(ioProxy.io, 'emit')
    const payload: RegisterUserCertificatePayload = {
      id: 'someCommunityId',
      userCsr: 'userCsr',
      serviceAddress: 'improperServiceAddress.onion'
    }
    await ioProxy.registerUserCertificate(payload)
    expect(observedIO).toBeCalledTimes(1)
    expect(observedIO).toBeCalledWith(SocketActionTypes.ERROR, {
      type: SocketActionTypes.REGISTRAR,
      message: ErrorMessages.REGISTRAR_CONNECTION_FAILED,
      communityId: 'someCommunityId',
      code: 500
    })
  })

  it.each([
    [ErrorMessages.USERNAME_TAKEN, ErrorCodes.VALIDATION, 403],
    [ErrorMessages.INVALID_USERNAME, ErrorCodes.VALIDATION, 400],
    [ErrorMessages.REGISTRATION_FAILED, ErrorCodes.SERVER_ERROR, 500]
  ])(
    'emits error "%s" with code %s if registrar returns %s',
    async (socketMessage: string, socketStatusCode: number, registrarStatusCode: number) => {
      const observedIO = jest.spyOn(ioProxy.io, 'emit')
      const mockRegisterCertificate = jest.fn()
      ioProxy.connectionsManager.sendCertificateRegistrationRequest = mockRegisterCertificate
      mockRegisterCertificate.mockReturnValue(
        Promise.resolve(new ResponseMock().init(registrarStatusCode))
      )
      const payload: RegisterUserCertificatePayload = {
        id: 'someCommunityId',
        userCsr: 'userCsr',
        serviceAddress: 'http://properAddress.onion'
      }
      await ioProxy.registerUserCertificate(payload)
      expect(observedIO).toBeCalledTimes(1)
      expect(observedIO).toBeCalledWith(SocketActionTypes.ERROR, {
        type: SocketActionTypes.REGISTRAR,
        message: socketMessage,
        communityId: 'someCommunityId',
        code: socketStatusCode
      })
    }
  )

  it('sends user certificate after successful registration', async () => {
    const registrarResponse = {
      certificate: 'userCertificate',
      peers: ['peer1', 'peer2']
    }
    const observedIO = jest.spyOn(ioProxy.io, 'emit')
    const mockRegisterCertificate = jest.fn()
    ioProxy.connectionsManager.sendCertificateRegistrationRequest = mockRegisterCertificate
    mockRegisterCertificate.mockReturnValue(
      Promise.resolve(new ResponseMock().init(200, registrarResponse))
    )
    const payload: RegisterUserCertificatePayload = {
      id: 'someCommunityId',
      userCsr: 'userCsr',
      serviceAddress: 'http://properAddress.onion'
    }
    await ioProxy.registerUserCertificate(payload)
    expect(observedIO).toBeCalledTimes(1)
    expect(observedIO).toBeCalledWith(SocketActionTypes.SEND_USER_CERTIFICATE, {
      id: 'someCommunityId',
      payload: registrarResponse
    })
  })
})

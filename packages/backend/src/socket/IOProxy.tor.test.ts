import {
  Certificates,
  HiddenService,
  InitCommunityPayload,
  LaunchRegistrarPayload,
  PeerId
} from '@quiet/state-manager'
import { createMinConnectionManager, createTmpDir, tmpQuietDirPath } from '../common/testUtils'
import { getPorts } from '../common/utils'
import { createCertificatesTestHelper } from '../libp2p/tests/client-server'
import { CertificateRegistration } from '../registration'
import { Storage } from '../storage'
import IOProxy from './IOProxy'
jest.setTimeout(100_000)

test('IO proxy closes all services (using tor)', async () => {
  const peerId1: PeerId = {
    id: 'QmWVMaUqEB73gzgGkc9wS7rnhNcpSyH64dmbGUdU2TM3eV',
    privKey:
      'CAASqAkwggSkAgEAAoIBAQCY2r7s5YlgWXlHuHH4PY/cUik/m7GuWPdTPmmm4QZTr1VSyKgC2AMR45xrcGMjd5SDh1HjzbptJpYfGWO+Sbm6yK7EfxYN8gOXrbo0koKtPH0hrgzus+CqUCAQDE6XWzY5yP7caFt/RolZaBYNcKCWDCHv+bg/87u3MGwwSeaMjYWNAQ5IVWrUFnns8eiyNRhBGrEQZDTyO4X0oMeEkTTABMEJIpge91SWfuYuqltiNdkS9aiYS58F43IBHKKWLc39b3KbiykiG2IjrqVl2aAyb6vSgtiGkwi301jtWEctaDl2JbwZpgldOA83wH2aBPK9N9MaakEYdI2dHVSg8bf9AgMBAAECggEAOH8JeIfyecE4WXDr9wPSC232vwLt7nIFoCf+ZubfLskscTenGb37jH4jT3avvekx5Fd8xgVBNZzAeegpfKjFVCtepVQPs8HS4BofK9VHJX6pBWzObN/hVzHcV/Ikjj7xUPRgdti/kNBibcBR/k+1myAK3ybemgydQj1Mj6CQ7Tu/4npaRXhVygasbTgFCYxrV+CGjzITdCAdRTWg1+H6puxjfObZqj0wa4I6sCom0+Eau7nULtVmi0hodOwKwtmc2oaUyCQY2yiEjdZnkXEEhP1EtJka+kD96iAG3YvFqlcdUPYVlIxCP9h55AaOShnACNymiTpYzpCP/kUK9wFkZQKBgQD2wjjWEmg8DzkD3y19MVZ71w0kt0PgZMU+alR8EZCJGqvoyi2wcinfdmqyOZBf2rct+3IyVpwuWPjsHOHq7ZaJGmJkTGrNbndTQ+WgwJDvghqBfHFrgBQNXvqHl5EuqnRMCjrJeP8Uud1su5zJbHQGsycZwPzB3fSj0yAyRO812wKBgQCelDmknQFCkgwIFwqqdClUyeOhC03PY0RGngp+sLlu8Q8iyEI1E9i/jTkjPpioAZ/ub5iD6iP5gj27N239B/elZY5xQQeDA4Ns+4yNOTx+nYXmWcTfVINFVe5AK824TjqlCY2ES+/hVBKB+JQV6ILlcCj5dXz9cCbg6cys4TttBwKBgH+rdaSs2WlZpvIt4mdHw6tHVPGOMHxFJxhoA1Y98D4/onpLQOBt8ORBbGrSBbTSgLw1wJvy29PPDNt9BhZ63swI7qdeMlQft3VJR+GoQFTrR7N/I1+vYLCaV50X+nHel1VQZaIgDDo5ACtl1nUQu+dLggt9IklcAVtRvPLFX87JAoGBAIBl8+ZdWc/VAPjr7y7krzJ/5VdYF8B716R2AnliDkLN3DuFelYPo8g1SLZI0MH3zs74fL0Sr94unl0gHGZsNRAuko8Q4EwsZBWx97PBTEIYuXox5T4O59sUILzEuuUoMkO+4F7mPWxs7i9eXkj+4j1z+zlA79slG9WweJDiLYOxAoGBAMmH/nv1+0sUIL2qgE7OBs8kokUwx4P8ZRAlL6ZVC4tVuDBL0zbjJKcQWOcpWQs9pC6O/hgPur3VgHDF7gko3ZDB0KuxVJPZyIhoo+PqXaCeq4KuIPESjYKT803p2S76n/c2kUaQ5i2lYToClvhk72kw9o9niSyVdotXxC90abI9',
    pubKey:
      'CAASpgIwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQCY2r7s5YlgWXlHuHH4PY/cUik/m7GuWPdTPmmm4QZTr1VSyKgC2AMR45xrcGMjd5SDh1HjzbptJpYfGWO+Sbm6yK7EfxYN8gOXrbo0koKtPH0hrgzus+CqUCAQDE6XWzY5yP7caFt/RolZaBYNcKCWDCHv+bg/87u3MGwwSeaMjYWNAQ5IVWrUFnns8eiyNRhBGrEQZDTyO4X0oMeEkTTABMEJIpge91SWfuYuqltiNdkS9aiYS58F43IBHKKWLc39b3KbiykiG2IjrqVl2aAyb6vSgtiGkwi301jtWEctaDl2JbwZpgldOA83wH2aBPK9N9MaakEYdI2dHVSg8bf9AgMBAAE='
  }

  const peerId2: PeerId = {
    id: 'QmXUXwPa33HcTLqoSHu4YVL1dRCoadqNpgXAAAHSM7gggY',
    privKey:
      'CAASqAkwggSkAgEAAoIBAQDWw0HB4zFZx8xq65VOPpZ6IjTYMAVqSHPxwr1L282/P55iL/DWw/WObLZhTEfTbF1NE0329gnNx4OKw2jQLCQ1gdjSZ1wZXkTvKpECbJCITXxP1SlVo8KpBSaEuEVZVmdkGT4XdT3xCdqQtg1nFCnpbvtZ4ba8npevWU+xi2gq6ym0shgz1Ie7Oqe6RUOgJF3X82orqnlUvZnKwv1RlzniGW3y3cg7y/nC8GAouURtG581JgbcCVdxa4ci7sJXEKvZIOf6VxxmKlm/dfP6AJb6GQ/mBHI2en9EZQbRjmRYEpgHpQU/XVCZENyMHDven4YIEYrbic6iKApSJlHpPlzLAgMBAAECggEAG6NRKRSF21n9Ep1yv3kKgHk6d7/mUoE0ep5nIgYNellDlrs4sUrSpRuUdP0OGUVO1IZxeCC9rj/Iy+jN6kxj9IbbUmh+z7zz/htqQfeaug/Oua9i/GRwvrOs+1ODiTW3ZIhjFz29VPHBsPHc07Eim6nuquiDTc7TEnvZ561bIHqarIYSTBin9ocWXEcgHpGyOk0yCkQ7ubfADCiLG+vK+X0QIsk6jJTx+daS1TOlfoiL+1U6wV2UV5FbhvsXqQlqwbsOYCaWONj9cMKM10ppBeCTlizx34JO1q0l/GrIsmIe2kNIzI9+9vf9ii+Fn8nDKSjVSIuvQekqLbOBu0efEQKBgQDvNAaD5TjLb+GtYkNh4bLRptw95d1u8SEjMkDvUbTKk3eK30r325VaQkOhuJZjKAgJO1IzAYb7BghQJbWm/8f5kNLU+Gs8r8AQlDzgkrQ1R/tDfXfO117uENaRiicX0wTyicUGh0L0rAHnadk9OaBmtHmQrD00bKH996X78KqErQKBgQDl1+IRqUZw3FgKVDLMoJTazpTDwIqgs0Y0yuBqQnPM0TYVWJ3C55rFqdE1TvnSNYjLdkzQMW5WMUzm964Rr0ajfvJX33izt6c5//B7lLrMKqGb4YWItR+fvbmpQcuNcMCiBRCHMUO2+M54vZPsJmGPTWbaJocwtpK7tXMO65seVwKBgBGmoSRycbJxWxHUQmyinvNhgLcAk0pweKWEO85tFQ4tu5B/0aRgi7DRWvRADrjaZ11nBzXEUxWK6GohnjnoffUofqZAfolH3sBab/OSX8HewefFBmY49kRS8cJjk2bqp17OU7+bk5FCcBGHegROkEuD3cSTMSEBMyLud00UAUExAoGBAOHwnmMOLBi2AjXlHyrYkHunp8XmeGAQ22r6JDFQsdUdtDS3sB3w3syAaxAkWqCxz49y83+VmAlS3W4O/CaWTrJaEJEhNN42I0V4u0ZApoAdSFCcGVCR/ExjjSc9boPT2wlqQR0k6JPtccpvUgJKmIzuYbUBOtRAJW4wqLJ6GTpxAoGBAKbEE1+i20RODcpTDG1mUy1zXTkz6BWyizDoilQ94gsxwvO4R0SxhnbhMBlIZ3awBwVmQtmVbkxEQT/GkANKs0o4eVMBvcZ9ctyqTauawJtelDsSgZUav2DkzsdUW80crzgethwNwKFWylkJbzmG34lH0QGdDJ4HeWVNBvNe4ejG',
    pubKey:
      'CAASpgIwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQDWw0HB4zFZx8xq65VOPpZ6IjTYMAVqSHPxwr1L282/P55iL/DWw/WObLZhTEfTbF1NE0329gnNx4OKw2jQLCQ1gdjSZ1wZXkTvKpECbJCITXxP1SlVo8KpBSaEuEVZVmdkGT4XdT3xCdqQtg1nFCnpbvtZ4ba8npevWU+xi2gq6ym0shgz1Ie7Oqe6RUOgJF3X82orqnlUvZnKwv1RlzniGW3y3cg7y/nC8GAouURtG581JgbcCVdxa4ci7sJXEKvZIOf6VxxmKlm/dfP6AJb6GQ/mBHI2en9EZQbRjmRYEpgHpQU/XVCZENyMHDven4YIEYrbic6iKApSJlHpPlzLAgMBAAE='
  }

  const hiddenService1: HiddenService = {
    onionAddress: 'u2rg2direy34dj77375h2fbhsc2tvxj752h4tlso64mjnlevcv54oaad.onion',
    privateKey:
      'ED25519-V3:uCr5t3EcOCwig4cu7pWY6996whV+evrRlI0iIIsjV3uCz4rx46sB3CPq8lXEWhjGl2jlyreomORirKcz9mmcdQ=='
  }
  const hiddenService2: HiddenService = {
    onionAddress: 'uec6jplmrnx3mocxtq3uc52cxlfdoq3ln4gqa4vkxapn74ro4glyfsqd.onion',
    privateKey:
      'ED25519-V3:oDVdj31fEb1v8j7YIBA+Ohnnmg9BIt+3OLC7AXFWw34Wwc8mgTeNd66FLdKCv4vfCA1Mumele58HPd8xgIED9g=='
  }

  const pems = await createCertificatesTestHelper(hiddenService1.onionAddress, 'adres2.onion')

  const certs1: Certificates = {
    certificate: pems.servCert,
    key: pems.servKey,
    CA: [pems.ca]
  }
  const certs2: Certificates = {
    certificate: pems.userCert,
    key: pems.userKey,
    CA: [pems.ca]
  }
  const appDataPath = createTmpDir()
  const manager = createMinConnectionManager({
    env: { appDataPath: tmpQuietDirPath(appDataPath.name) },
  })

  await manager.init()
  const ioProxy = new IOProxy(manager)
  await ioProxy.createCommunity({
    id: 'myCommunity1',
    peerId: peerId1,
    hiddenService: hiddenService1,
    certs: certs1
  })

  const launchRegistrarPayload: LaunchRegistrarPayload = {
    id: 'myCommunity1',
    peerId: peerId1.id,
    rootCertString: pems.ca,
    rootKeyString: pems.ca_key
  }

  const createCommunityPayload: InitCommunityPayload = {
    id: 'myCommunity2',
    peerId: peerId2,
    hiddenService: hiddenService2,
    certs: certs2
  }

  await ioProxy.launchRegistrar(launchRegistrarPayload)

  await ioProxy.createCommunity(createCommunityPayload)

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

import OrbitDB from 'orbit-db'
import fs from 'fs'
import { jest } from '@jest/globals'
import { EventEmitter } from 'events'
import { create, IPFS } from 'ipfs-core'
import { ORBIT_DB_DIR } from '../../const'
import { CommunityMetadata } from '@quiet/types'
import { CertificatesStore } from './certificates.store'

const createOrbitDbInstance = async () => {
  const ipfs: IPFS = await create()
  // @ts-ignore
  const orbitdb = await OrbitDB.createInstance(ipfs, {
    directory: ORBIT_DB_DIR,
  })

  return { orbitdb, ipfs }
}

const communityMetadata: CommunityMetadata = {
  id: '39F7485441861F4A2A1A512188F1E0AA',
  rootCa:
    'MIIBUDCB+KADAgECAgEBMAoGCCqGSM49BAMCMBIxEDAOBgNVBAMTB3JvY2tldHMwHhcNMTAxMjI4MTAxMDEwWhcNMzAxMjI4MTAxMDEwWjASMRAwDgYDVQQDEwdyb2NrZXRzMFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE/ESHf6rXksyiuxSKpQgtiSAhVWNtx4vbFgW6knWfH7MR4dPyxiCNgSeCzRfreuhqVpVtv3U49tcwsqDGkoWHsKM/MD0wDwYDVR0TBAgwBgEB/wIBAzALBgNVHQ8EBAMCAIYwHQYDVR0lBBYwFAYIKwYBBQUHAwIGCCsGAQUFBwMBMAoGCCqGSM49BAMCA0cAMEQCIHrYMhgU/RluSsWoO205EjCQ8pE5MeBZ4Cp8PTgNkOW7AiA690+KIgobiObH6/1JDuS82R0NPO84Ttc8PY886AoKbA==',
  ownerCertificate:
    'MIIDeTCCAx6gAwIBAgIGAYwVp42mMAoGCCqGSM49BAMCMBIxEDAOBgNVBAMTB3JvY2tldHMwHhcNMjMxMTI4MTExOTExWhcNMzAwMTMxMjMwMDAwWjBJMUcwRQYDVQQDEz5jYXJhaTJ0d2phem50aW56bndtcnlqdzNlNzVmdXF0Z2xrd2hsemo2d3RlcWx4ano2NnRsZnhpZC5vbmlvbjBZMBMGByqGSM49AgEGCCqGSM49AwEHA0IABNMUauWsTJiuDGt4zoj4lKGgHMkTH96M11fCxMwIInhan0RUB5sv+PtGKbfEfawGjhSQiUaTLdwUGjyIdMs3OMWjggInMIICIzAJBgNVHRMEAjAAMAsGA1UdDwQEAwIAgDAdBgNVHSUEFjAUBggrBgEFBQcDAgYIKwYBBQUHAwEwggFHBgkqhkiG9w0BCQwEggE4BIIBNBETZ2k8vszIRvkuOUk/cNtOb8JcGmw5yVhs45/+e7To4t51nwcdAODj5juVi6+SpLCcHCHhE+g7KswEkC1ScFrW6CRinSgrNBOAUIjOtvWZ/GvK6lI4WTMf7xAaRaJSCF6H0m4cFoUY3JpklJleHhzj0re+NmFZEJ/hNRKochGFy4Xq9Z7StvPpGBlfxhmR7X2t/+HtZaAAbLRLLgbHtCQ7fecg0Qb9Ej58uc+T4Gd2+8ptWvebtOQVU70VAL7uT6aLkFXaDibgSt3kDNvGrwn3AxWlESgROTh5+OWWbfYIbFxjf0PkPDdUSAIOKS9qbYZ+bSYfVq+/0JFyZAa0zhPtgW8wjj0gDCLVm5joyW5Hz2eZ36W7u3cxFME2qmT9G2Dh6NGLn7G19ulVzoTkVmP5/tGPMBUGCisGAQQBg4wbAgEEBxMFZGF2aWQwPQYJKwYBAgEPAwEBBDATLlFtZE5GVjc3dXZOcTJBaWlqUEY0dzY2OU1ucWdiYVdMR1VhZlh0WTdlZjNRRFMwSQYDVR0RBEIwQII+Y2FyYWkydHdqYXpudGluem53bXJ5anczZTc1ZnVxdGdsa3dobHpqNnd0ZXFseGp6NjZ0bGZ4aWQub25pb24wCgYIKoZIzj0EAwIDSQAwRgIhAOafgBe5T0EFjyy0tCRrTHJ1+5ri0W6kAUfc6eRKHIZAAiEA7rFEfPDU+D8MiOF+w0QOdp46dqaWsHFjrDHYPSYGxQA=',
}

type CertificateData = {
  certificate: string
  pubkey: string
  username: string
}

const validCertificates: CertificateData[] = [
  {
    certificate:
      'MIIDeTCCAx6gAwIBAgIGAYwVp42mMAoGCCqGSM49BAMCMBIxEDAOBgNVBAMTB3JvY2tldHMwHhcNMjMxMTI4MTExOTExWhcNMzAwMTMxMjMwMDAwWjBJMUcwRQYDVQQDEz5jYXJhaTJ0d2phem50aW56bndtcnlqdzNlNzVmdXF0Z2xrd2hsemo2d3RlcWx4ano2NnRsZnhpZC5vbmlvbjBZMBMGByqGSM49AgEGCCqGSM49AwEHA0IABNMUauWsTJiuDGt4zoj4lKGgHMkTH96M11fCxMwIInhan0RUB5sv+PtGKbfEfawGjhSQiUaTLdwUGjyIdMs3OMWjggInMIICIzAJBgNVHRMEAjAAMAsGA1UdDwQEAwIAgDAdBgNVHSUEFjAUBggrBgEFBQcDAgYIKwYBBQUHAwEwggFHBgkqhkiG9w0BCQwEggE4BIIBNBETZ2k8vszIRvkuOUk/cNtOb8JcGmw5yVhs45/+e7To4t51nwcdAODj5juVi6+SpLCcHCHhE+g7KswEkC1ScFrW6CRinSgrNBOAUIjOtvWZ/GvK6lI4WTMf7xAaRaJSCF6H0m4cFoUY3JpklJleHhzj0re+NmFZEJ/hNRKochGFy4Xq9Z7StvPpGBlfxhmR7X2t/+HtZaAAbLRLLgbHtCQ7fecg0Qb9Ej58uc+T4Gd2+8ptWvebtOQVU70VAL7uT6aLkFXaDibgSt3kDNvGrwn3AxWlESgROTh5+OWWbfYIbFxjf0PkPDdUSAIOKS9qbYZ+bSYfVq+/0JFyZAa0zhPtgW8wjj0gDCLVm5joyW5Hz2eZ36W7u3cxFME2qmT9G2Dh6NGLn7G19ulVzoTkVmP5/tGPMBUGCisGAQQBg4wbAgEEBxMFZGF2aWQwPQYJKwYBAgEPAwEBBDATLlFtZE5GVjc3dXZOcTJBaWlqUEY0dzY2OU1ucWdiYVdMR1VhZlh0WTdlZjNRRFMwSQYDVR0RBEIwQII+Y2FyYWkydHdqYXpudGluem53bXJ5anczZTc1ZnVxdGdsa3dobHpqNnd0ZXFseGp6NjZ0bGZ4aWQub25pb24wCgYIKoZIzj0EAwIDSQAwRgIhAOafgBe5T0EFjyy0tCRrTHJ1+5ri0W6kAUfc6eRKHIZAAiEA7rFEfPDU+D8MiOF+w0QOdp46dqaWsHFjrDHYPSYGxQA=',
    pubkey: 'BNMUauWsTJiuDGt4zoj4lKGgHMkTH96M11fCxMwIInhan0RUB5sv+PtGKbfEfawGjhSQiUaTLdwUGjyIdMs3OMU=',
    username: 'david',
  },
  {
    certificate:
      'MIIDdjCCAx2gAwIBAgIGAYwVqZ/fMAoGCCqGSM49BAMCMBIxEDAOBgNVBAMTB3JvY2tldHMwHhcNMjMxMTI4MTEyMTI3WhcNMzAwMTMxMjMwMDAwWjBJMUcwRQYDVQQDEz52cnB1ZGdnNGF4cmxobG1jN3c0dmdheTJta292ZGN6dnRtbTVoMjJ0ajZobWR3eXV1NDdhc3l5ZC5vbmlvbjBZMBMGByqGSM49AgEGCCqGSM49AwEHA0IABE2KvinBVv6mALtFfw2xIVJXu48q6Vaxsz1GJNUe1K6ysJT0hjyed3l0OOP8KGzUAc0OacEZuzSbDnkdP/gbmMOjggImMIICIjAJBgNVHRMEAjAAMAsGA1UdDwQEAwIAgDAdBgNVHSUEFjAUBggrBgEFBQcDAgYIKwYBBQUHAwEwggFHBgkqhkiG9w0BCQwEggE4BIIBNBHLSx5u5At8mlxe6cM+tnpx1rhcVQC8dA3M5OXIB1BO4NzM0o71IqL1mwlviMd9EeSTiqM3mOBJzGS/sG3m62ppdfSuxV2OfjILYF17NpHBY45y0nmQUer4geLlBxtvEZ6e0CiK/uD2oGks7BG78AsclP/97lXNf8ElH8DT+AskO91Zd1zS+8IQxmOr8/EpCnjR+7VMzpgIG57C6pdmZdmLLCJlKcr26XL91hH5cY/i1s2Yf36ScOJKSgz0GEzul0uoW2f+Oags6WYzcY527pGwFJTItmWZQHlC5weaX8mtqgl1/4Wb4lXB4ToMe0Kwj5z55fggG+OLbMkzMUimWJKmb7IcXfYZaZqKWL4jPeMahywxS88vuOYRjIbv5h3/7sdbClGWs7sFbBXaG++rRMINIFp0MBQGCisGAQQBg4wbAgEEBhMEam9objA9BgkrBgECAQ8DAQEEMBMuUW1aZnBpVnU2cnFEaTQ5QTR5Sk15elE3a25HdERGTllneWc4R1BKbjlnODRtZzBJBgNVHREEQjBAgj52cnB1ZGdnNGF4cmxobG1jN3c0dmdheTJta292ZGN6dnRtbTVoMjJ0ajZobWR3eXV1NDdhc3l5ZC5vbmlvbjAKBggqhkjOPQQDAgNHADBEAiBnUY9HiL5w3OM6Y5vVmOQD/GEYKgHZIYpTD9g3DDj+cgIgTULiWXUb6GSRZIQx1Lm0eqiwKZvp0MmwmhR+MyzXEW4=',
    pubkey: 'BE2KvinBVv6mALtFfw2xIVJXu48q6Vaxsz1GJNUe1K6ysJT0hjyed3l0OOP8KGzUAc0OacEZuzSbDnkdP/gbmMM=',
    username: 'john',
  },
]

describe('CertificatesStore', () => {
  let ipfs: IPFS
  let orbitdb: OrbitDB
  let store: CertificatesStore
  let emitter: EventEmitter

  beforeEach(async () => {
    ;({ orbitdb, ipfs } = await createOrbitDbInstance())
    store = new CertificatesStore(orbitdb)
    emitter = new EventEmitter()
    await store.init(emitter)
  })

  afterEach(async () => {
    await store.close()
    await orbitdb.stop()
    await ipfs.stop()
    if (fs.existsSync(ORBIT_DB_DIR)) {
      fs.rmSync(ORBIT_DB_DIR, { recursive: true, force: true })
    }
  })

  test('update metadata property', async () => {
    store.updateMetadata(communityMetadata)
    // @ts-expect-error - metadata property is private
    expect(store.metadata).toEqual(communityMetadata)
  })

  test('do not update metadata property with invalid value', async () => {
    // @ts-expect-error - null is not a proper value
    store.updateMetadata(null)
    // @ts-expect-error - metadata property is private
    const metadata = store.metadata
    expect(metadata).not.toEqual(null)
  })

  test('validate certificate against root certificate', async () => {
    const { certificate } = validCertificates[1]

    store.updateMetadata(communityMetadata)

    // @ts-expect-error - validateCertificate is private
    const res = await store.validateCertificateAuthority(certificate)

    expect(res).toBeTruthy()
  })

  test('validates certificate format properly (positive case)', async () => {
    const { certificate } = validCertificates[1]

    // @ts-expect-error - validateCertificate is private
    const res = await store.validateCertificateFormat(certificate)

    expect(res).toEqual([])
  })

  test('validates certificate format properly (negative case)', async () => {
    const certificate = 'certificate'

    // @ts-expect-error - validateCertificate is private
    const res = await store.validateCertificateFormat(certificate)

    expect(res).not.toEqual([])
  })

  test('should add and get a valid certificate from the store', async () => {
    const { certificate } = validCertificates[1]

    store.updateMetadata(communityMetadata)

    await store.addCertificate(certificate)

    // @ts-expect-error - getCertificates is protected
    const certificates = await store.getCertificates()

    expect(certificates).toContain(certificate)
  })

  // Let's wait for actual validation
  test('should not get invalid certificate form the store', async () => {
    const certificate = 'certificate'

    store.updateMetadata(communityMetadata)

    await store.addCertificate(certificate)

    // @ts-expect-error - getCertificates is protected
    const certificates = await store.getCertificates()

    expect(certificates).not.toContain(certificate)
  })

  test('should load all certificates from the store', async () => {
    const { certificate: certificate1 } = validCertificates[0]
    const { certificate: certificate2 } = validCertificates[1]

    store.updateMetadata(communityMetadata)

    // @ts-expect-error - getCertificates is protected
    jest.spyOn(store, 'getCertificates').mockResolvedValue([certificate1, certificate2])

    const certificates = await store.loadAllCertificates()

    expect(certificates).toContain(certificate1)
    expect(certificates).toContain(certificate2)
  })

  test('should get the username for a given public key', async () => {
    const { certificate, pubkey, username } = validCertificates[1]

    store.updateMetadata(communityMetadata)

    await store.addCertificate(certificate)

    const result = await store.getCertificateUsername(pubkey)
    expect(result).toBe(username)
  })
})

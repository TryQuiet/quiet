import OrbitDB from 'orbit-db'
import fs from 'fs'
import { jest } from '@jest/globals'
import { create, IPFS } from 'ipfs-core'
import { CertificatesStore } from './certificates.store'
import { EventEmitter } from 'events'
import { ORBIT_DB_DIR } from '../../const'

const createOrbitDbInstance = async () => {
  const ipfs: IPFS = await create()
  // @ts-ignore
  const orbitdb = await OrbitDB.createInstance(ipfs, {
    directory: ORBIT_DB_DIR,
  })

  return { orbitdb, ipfs }
}

type CetrificateData = {
  certificate: string
  pubkey: string
  username: string
}

const validCertificates: CetrificateData[] = [
  {
    certificate:
      'MIIDeDCCAx6gAwIBAgIGAYwBBkidMAoGCCqGSM49BAMCMBIxEDAOBgNVBAMTB3JvY2tldHMwHhcNMjMxMTI0MTExMDM4WhcNMzAwMTMxMjMwMDAwWjBJMUcwRQYDVQQDEz4zZmRobWN1dmVvZWtnc3l3c3F3cjN4NGJrYWxyeGd5em0zeG5hdnVlNXZqMm40Ymhncmk1a29xZC5vbmlvbjBZMBMGByqGSM49AgEGCCqGSM49AwEHA0IABFDLlSJWtDJOBo1UxxJ5fEUqL4PzvrrOPJGzWyybFKoFV9mYOWuxZyY+MiQK70yCxz4rNKE2oOBi1QCwKM0uSyijggInMIICIzAJBgNVHRMEAjAAMAsGA1UdDwQEAwIAgDAdBgNVHSUEFjAUBggrBgEFBQcDAgYIKwYBBQUHAwEwggFHBgkqhkiG9w0BCQwEggE4BIIBNC1P3xhxPFjygy1aF+vafhAFzDXWaY3o++LJ3zUPKaHhYYkVJ5p2w5X8rirQcTwp15GHxOdVFm1cUlNqBN6FDBOj7XaryLOm02F52mb1kcLf9G+cJNgjhkj+wSPoSTgc30kEOg2XpUtOuNy7oS55RxHTfOME2gaXyHDR8MVTIn7BXZDphmFC0CGHx10o9tMPUa78sdj/fUBtu0htyXPoyLqMxaMgzQQG7zXj+EIVcMsF3iZ2XhUpqUcFvlHrgaMnm5twTYUU5/2111IHN+nwJGetWCz8MoluXWRn0NlGmNGIAGoo6XLLbTYZHyvGSxwq0pgnHLmANvoWeGdj/TSQYf5PBNEkP5q34GY85bIMwJw05xVng7WwhvcMnsyu8ciEmKNoc4WdKo8dXXEKby6mRYjXo/ccMBUGCisGAQQBg4wbAgEEBxMFZGF2aWQwPQYJKwYBAgEPAwEBBDATLlFtVmJ6RnkzbVRSTGFiV2EyeWZKWk5uYno1eVFyQ3NCeW5IYmdUazc5aE1TY0IwSQYDVR0RBEIwQII+M2ZkaG1jdXZlb2VrZ3N5d3Nxd3IzeDRia2FscnhneXptM3huYXZ1ZTV2ajJuNGJoZ3JpNWtvcWQub25pb24wCgYIKoZIzj0EAwIDSAAwRQIgQ2BjwCVyK45ijkBLTcwl++cH9vEWGwZteOkbXQqwiVsCIQDIfguozFosukiqY2FXJhu5Y+i4Y4KOZHyaiDskL7+T5A==',
    pubkey: 'BFDLlSJWtDJOBo1UxxJ5fEUqL4PzvrrOPJGzWyybFKoFV9mYOWuxZyY+MiQK70yCxz4rNKE2oOBi1QCwKM0uSyg=',
    username: 'david',
  },
  {
    certificate:
      'MIIDdzCCAx2gAwIBAgIGAYwBCyPTMAoGCCqGSM49BAMCMBIxEDAOBgNVBAMTB3JvY2tldHMwHhcNMjMxMTI0MTExNTU2WhcNMzAwMTMxMjMwMDAwWjBJMUcwRQYDVQQDEz50ZHo2end2ZnRxNHNzaGNtaTV6Z3llN3YyenlzZGU1d2w2cnJvZG96Z21ucm54YnNzczd1NTZ5ZC5vbmlvbjBZMBMGByqGSM49AgEGCCqGSM49AwEHA0IABIuy4vcSwRbXAwevi0dfUFLgOeUltYKYSVIj5YkBtPh3eZqtxCAsh1nNf4Fh8ejFNPxOuLk0m//kzVBK8oAumx+jggImMIICIjAJBgNVHRMEAjAAMAsGA1UdDwQEAwIAgDAdBgNVHSUEFjAUBggrBgEFBQcDAgYIKwYBBQUHAwEwggFHBgkqhkiG9w0BCQwEggE4BIIBNC2+sMn3amTDx+iAEmrVLd0YlBG+5kMfKyvpa7SGE5W5IDVe2GU03gwVNpJZZzJ23DxkYoFQUJpShC4dHqgjRwJARarDRBly345O2n1FU+tRA3u4Z306lTVgb/lvjCseuoQYH0MKXojqsjYCRHRAvgpbZj+5GPdarMx5xtgig/PUdTKeGksrK8QVmdxejhLXzvQHOqaWj2bl21IQuOXbGmGK8wpTrfOT1BJ7i1uWx+d03MT+8ldwlnjkjHRqr07yX0O1jyawh4rCSEsG/9Xl7rgysaBQkKl6k9eGCR8aSIZXzVKFoYoFUjIBmrN3cPHSi9c76nL+6LK7XQgigYUpt1yxQrIbGBQM/EwVt+Z+yEKgpailm7UY4qdveDrOs7hiQ3d9DBwFEysndBGgo16VAWr0T7UxMBQGCisGAQQBg4wbAgEEBhMEam9objA9BgkrBgECAQ8DAQEEMBMuUW1SdGhWaTJhUFRoRWhnb1dxNG1EZ2pHNkd6dUxqZDJRbWo1d0JydktYTjFpdzBJBgNVHREEQjBAgj50ZHo2end2ZnRxNHNzaGNtaTV6Z3llN3YyenlzZGU1d2w2cnJvZG96Z21ucm54YnNzczd1NTZ5ZC5vbmlvbjAKBggqhkjOPQQDAgNIADBFAiEAkhyFBTgcyo56AvNMxvjDr8NCXjy3pRwDAwYFDDf9nLMCIBAA0IKGd3s0QgRfitNVeWrq5rxjxMayNdnaZejypXZT',
    pubkey: 'BIuy4vcSwRbXAwevi0dfUFLgOeUltYKYSVIj5YkBtPh3eZqtxCAsh1nNf4Fh8ejFNPxOuLk0m//kzVBK8oAumx8=',
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

  test('should add and get a valid certificate from the store', async () => {
    const { certificate } = validCertificates[0]

    await store.addCertificate(certificate)

    // @ts-expect-error - getCertificates is protected
    const certificates = await store.getCertificates()

    expect(certificates).toContain(certificate)
  })

  // Let's wait for actual validation
  test.skip('should not get invalid certificate form the store', async () => {
    const certificate = 'certificate'

    await store.addCertificate(certificate)

    // @ts-expect-error - validateCertificate is private
    jest.spyOn(store, 'validateCertificate').mockResolvedValue(false)

    // @ts-expect-error - getCertificates is protected
    const certificates = await store.getCertificates()

    expect(certificates).not.toContain(certificate)
  })

  test('should load all certificates from the store', async () => {
    const { certificate: certificate1 } = validCertificates[0]
    const { certificate: certificate2 } = validCertificates[1]

    // @ts-expect-error - getCertificates is protected
    jest.spyOn(store, 'getCertificates').mockResolvedValue([certificate1, certificate2])

    const certificates = await store.loadAllCertificates()

    expect(certificates).toContain(certificate1)
    expect(certificates).toContain(certificate2)
  })

  test('should get the username for a given public key', async () => {
    const { certificate, pubkey, username } = validCertificates[0]

    await store.addCertificate(certificate)

    // @ts-expect-error - getCertificates is protected
    jest.spyOn(store, 'getCertificates').mockResolvedValue([certificate])

    const result = store.getCertificateUsername(pubkey)
    expect(result).toBe(username)
  })
})

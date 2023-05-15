import { invitationShareUrl } from '@quiet/common'
import { setupCrypto } from '@quiet/identity'
import { Store } from '@reduxjs/toolkit'
import { getFactory } from '../../utils/tests/factories'
import { prepareStore } from '../../utils/tests/prepareStore'
import { identityActions } from '../identity/identity.slice'
import { Identity } from '../identity/identity.types'
import { usersActions } from '../users/users.slice'
import { communitiesSelectors } from './communities.selectors'
import { communitiesActions, Community } from './communities.slice'

describe('communitiesSelectors', () => {
  setupCrypto()

  let store: Store
  let communityAlpha: Community
  let communityBeta: Community
  let identity: Identity

  beforeEach(async () => {
    store = prepareStore({}).store
    const factory = await getFactory(store)
    communityAlpha = await factory.create<
      ReturnType<typeof communitiesActions.addNewCommunity>['payload']
    >('Community')
    identity = await factory.create<ReturnType<typeof identityActions.addNewIdentity>['payload']>(
      'Identity',
      { id: communityAlpha.id, nickname: 'john' }
    )

    communityBeta = await factory.create<
      ReturnType<typeof communitiesActions.addNewCommunity>['payload']
    >('Community')
  })

  it('select community by id', () => {
    const community = communitiesSelectors.selectById(communityBeta.id)(store.getState())
    expect(community).toBe(communityBeta)
  })

  it('select current community id', () => {
    const communityId = communitiesSelectors.currentCommunityId(store.getState())
    expect(communityId).toBe(communityAlpha.id)
  })

  it('select current community', () => {
    const community = communitiesSelectors.currentCommunity(store.getState())
    expect(community).toEqual({ ...communityAlpha, ownerCertificate: identity.userCertificate })
  })

  it('returns registrar url without port if no port in the store', async () => {
    const onionAddress = 'aznu6kiyutsgjhdue4i4xushjzey6boxf4i4isd53admsibvbt6qyiyd'
    const { store } = prepareStore()
    const factory = await getFactory(store)
    const community = await factory.create<
      ReturnType<typeof communitiesActions.addNewCommunity>['payload']
    >('Community', {
      onionAddress,
      port: 0
    })
    const registrarUrl = communitiesSelectors.registrarUrl(community.id)(store.getState())
    expect(registrarUrl).toBe(onionAddress)
  })

  it('returns registrar url with port if port exists in the store', async () => {
    const onionAddress = 'aznu6kiyutsgjhdue4i4xushjzey6boxf4i4isd53admsibvbt6qyiyd'
    const port = 777
    const { store } = prepareStore()
    const factory = await getFactory(store)
    const community = await factory.create<
      ReturnType<typeof communitiesActions.addNewCommunity>['payload']
    >('Community', {
      onionAddress,
      port
    })
    const registrarUrl = communitiesSelectors.registrarUrl(community.id)(store.getState())
    expect(registrarUrl).toBe(`${onionAddress}:${port}`)
  })

  it('returns registrar url if no onion address, no port', async () => {
    const url = 'http://aznu6kiyutsgjhdue4i4xushjzey6boxf4i4isd53admsibvbt6qyiyd'
    const { store } = prepareStore()
    const factory = await getFactory(store)
    const community = await factory.create<
      ReturnType<typeof communitiesActions.addNewCommunity>['payload']
    >('Community', {
      registrarUrl: url,
      port: 0,
      onionAddress: ''
    })
    const registrarUrl = communitiesSelectors.registrarUrl(community.id)(store.getState())
    expect(registrarUrl).toBe(url)
  })

  it('invitationUrl selector does not break if there is no community', () => {
    const { store } = prepareStore()
    const invitationUrl = communitiesSelectors.invitationUrl(store.getState())
    expect(invitationUrl).toEqual('')
  })

  it('returns proper invitation url if registrationUrl is in old format', async () => {
    const code = 'aznu6kiyutsgjhdue4i4xushjzey6boxf4i4isd53admsibvbt6qyiyd'
    const registrarUrl = `http://${code}`
    const { store } = prepareStore()
    const factory = await getFactory(store)
    await factory.create<ReturnType<typeof communitiesActions.addNewCommunity>['payload']>(
      'Community',
      {
        registrarUrl: registrarUrl,
        port: 0,
        onionAddress: ''
      }
    )
    const invitationUrl = communitiesSelectors.invitationUrl(store.getState())
    expect(invitationUrl).toEqual(invitationShareUrl(code))
  })

  it('returns proper invitation url if registrationUrl is just onion address', async () => {
    const code = 'aznu6kiyutsgjhdue4i4xushjzey6boxf4i4isd53admsibvbt6qyiyd'
    const { store } = prepareStore()
    const factory = await getFactory(store)
    await factory.create<ReturnType<typeof communitiesActions.addNewCommunity>['payload']>(
      'Community',
      {
        registrarUrl: code,
        port: 0,
        onionAddress: ''
      }
    )
    const invitationUrl = communitiesSelectors.invitationUrl(store.getState())
    expect(invitationUrl).toEqual(invitationShareUrl(code))
  })

  it('returns proper ownerNickname - ownerCertificate exist', async () => {
    const { store } = prepareStore()
    expect(identity.userCertificate).not.toBeUndefined()
    store.dispatch(
      usersActions.responseSendCertificates({
        certificates: [identity.userCertificate || '']
      })
    )
    const expexctedNickname = 'alice'
    const ownerCertificate =
      'MIIDdDCCAxugAwIBAgIGAYeiqwwYMAoGCCqGSM49BAMCMA8xDTALBgNVBAMTBHRlc3QwHhcNMjMwNDIxMDcxNTMxWhcNMzAwMTMxMjMwMDAwWjBJMUcwRQYDVQQDEz5qYm1zbXR4Z2Rhd241ZTdyZ3Z5ZGZ3bGFuY3c1bnZkcmZjdXdvdmltNzJqeXY2ZTN5eDR0ZXhxZC5vbmlvbjBZMBMGByqGSM49AgEGCCqGSM49AwEHA0IABBjP55M/p8QVQGdgjtAdGwLS8uyzyIaWzvnuCvOwLs/u+FHUdb0DU2+M4TYEZjVHmqn+hSERs4XHG0/tbaaGSyGjggInMIICIzAJBgNVHRMEAjAAMAsGA1UdDwQEAwIAgDAdBgNVHSUEFjAUBggrBgEFBQcDAgYIKwYBBQUHAwEwggFHBgkqhkiG9w0BCQwEggE4BIIBNCqfocsbSvEqAdeRObiywx0KV2r7xEnqFysFuc1InEpwF3707TZGrFxww74g/ccxHCZ9zda4EHawgLoU6oKdeyec8W7qAThnWCRzJcOPINdZaTR45g28jeWAXMAtVG6eYtEQS4t7g915QaB0uYUoM3Teqp/qaMhk/9Hs4jiKlN3wL9WFYRf14XQIIVu3Fb0f3sD2/ejNPRJztJeJCwYtcFNF3fhPpH5bSPlcy6IaxhQrMXboqAfSAUlnMD4PifHFxvQYbfvTEC65Gt+FzwJ956BA5PuKsGFf+NVznyp5/YtFrl0XRRdlBcTzp2jreqhxBCdsvCpPwvM2TRv4OPk+hjMPPzBdPgvs5tytiFFyK9hXemai2TTwP1qo+VuV5SYyAyZP4rPxc/XEDHk+W3QN0vF8Ff+iMBUGCisGAQQBg4wbAgEEBxMFYWxpY2UwPQYJKwYBAgEPAwEBBDATLlFtZVN0WFY5VERXVHhoYXZUd25DZWdaYnNvMndQZ3BYQ2lzdHlCTEo2b0MyZHcwSQYDVR0RBEIwQII+amJtc210eGdkYXduNWU3cmd2eWRmd2xhbmN3NW52ZHJmY3V3b3ZpbTcyanl2NmUzeXg0dGV4cWQub25pb24wCgYIKoZIzj0EAwIDRwAwRAIga3etWmNtiMT/SUZkG0Rf5kwl3HxsGDJXsU7X5aCQAvMCIFKVBnCbTPseU5gQwamWZDG9ZoMf0X1VGzYUixWvmzuc'

    const factory = await getFactory(store)
    await factory.create<ReturnType<typeof communitiesActions.addOwnerCertificate>['payload']>(
      'Community',
      {
        ownerCertificate
      }
    )
    const ownerNickname = communitiesSelectors.ownerNickname(store.getState())
    expect(ownerNickname).toEqual(expexctedNickname)
  })

  it('returns proper ownerNickname - ownerCertificate not exist - backwards compatibility', async () => {
    const { store } = prepareStore()
    expect(identity.userCertificate).not.toBeUndefined()
    store.dispatch(
      usersActions.responseSendCertificates({
        certificates: [identity.userCertificate || '']
      })
    )
    const ownerNickname = communitiesSelectors.ownerNickname(store.getState())
    expect(ownerNickname).toEqual(identity.nickname)
  })
})

import { combineReducers, createStore, Store } from '@reduxjs/toolkit'
import { StoreKeys } from '../store.keys'
import { communitiesAdapter } from './../communities/communities.adapter'
import { communitiesReducer, CommunitiesState, Community } from './../communities/communities.slice'
import { identityAdapter } from './identity.adapter'
import { identitySelectors } from './identity.selectors'
import { identityReducer, IdentityState } from './identity.slice'
import { Identity } from './identity.types'

describe('communitiesSelectors will recive correct data', () => {
  let store: Store
  const communityAlpha: Community = {
    name: 'alpha',
    id: 'communityAlpha',
    CA: { rootCertString: 'certString', rootKeyString: 'keyString' },
    registrarUrl: '',
    rootCa: '',
    peerList: [],
    registrar: null,
    onionAddress: '',
    privateKey: '',
    port: 0
  }
  const communityBeta: Community = {
    name: 'beta',
    id: 'communityBeta',
    CA: { rootCertString: 'certString', rootKeyString: 'keyString' },
    registrarUrl: '',
    rootCa: '',
    peerList: [],
    registrar: null,
    onionAddress: '',
    privateKey: '',
    port: 0
  }

  const communityDelta: Community = {
    name: 'beta',
    id: 'communityDelta',
    CA: { rootCertString: 'certString', rootKeyString: 'keyString' },
    registrarUrl: '',
    rootCa: '',
    peerList: [],
    registrar: null,
    onionAddress: '',
    privateKey: '',
    port: 0
  }

  const identityAlpha: Identity = {
    id: 'communityAlpha',
    nickname: 'nickname',
    hiddenService: {
      onionAddress: '',
      privateKey: ''
    },
    dmKeys: {
      publicKey: '',
      privateKey: ''
    },
    peerId: {
      id: '',
      pubKey: '',
      privKey: ''
    },
    userCsr: null,
    userCertificate: 'userCert'
  }

  const identityBeta: Identity = {
    id: 'communityBeta',
    nickname: 'nickname',
    hiddenService: {
      onionAddress: '',
      privateKey: ''
    },
    dmKeys: {
      publicKey: '',
      privateKey: ''
    },
    peerId: {
      id: '',
      pubKey: '',
      privKey: ''
    },
    userCsr: null,
    userCertificate: 'userCert'
  }

  const identityDelta: Identity = {
    id: 'communityDelta',
    nickname: 'nickname',
    hiddenService: {
      onionAddress: '',
      privateKey: ''
    },
    dmKeys: {
      publicKey: '',
      privateKey: ''
    },
    peerId: {
      id: '',
      pubKey: '',
      privKey: ''
    },
    userCsr: null,
    userCertificate: null
  }

  beforeEach(() => {
    store = createStore(
      combineReducers({
        [StoreKeys.Communities]: communitiesReducer,
        [StoreKeys.Identity]: identityReducer
      }),
      {
        [StoreKeys.Communities]: {
          ...new CommunitiesState(),
          currentCommunity: 'communityBeta',
          communities: communitiesAdapter.setAll(communitiesAdapter.getInitialState(), [
            communityAlpha,
            communityBeta,
            communityDelta
          ])
        },
        [StoreKeys.Identity]: {
          ...new IdentityState(),
          identities: identityAdapter.setAll(identityAdapter.getInitialState(), [
            identityBeta,
            identityDelta
          ])
        }
      }
    )
  })

  it('select current id', () => {
    const currentIdentity = identitySelectors.currentIdentity(store.getState())

    expect(currentIdentity).toMatchInlineSnapshot(`
      Object {
        "dmKeys": Object {
          "privateKey": "",
          "publicKey": "",
        },
        "hiddenService": Object {
          "onionAddress": "",
          "privateKey": "",
        },
        "id": "communityBeta",
        "nickname": "nickname",
        "peerId": Object {
          "id": "",
          "privKey": "",
          "pubKey": "",
        },
        "userCertificate": "userCert",
        "userCsr": null,
      }
    `)
  })

  it('select joined communities with user identity with certificate', () => {
    const joinedCommunities = identitySelectors.joinedCommunities(store.getState())
    const idOfJoinedCommunities = joinedCommunities.map(community => community.id)

    expect(idOfJoinedCommunities).toEqual(['communityBeta'])
    expect(joinedCommunities).toMatchInlineSnapshot(`
      Array [
        Object {
          "CA": Object {
            "rootCertString": "certString",
            "rootKeyString": "keyString",
          },
          "id": "communityBeta",
          "name": "beta",
          "onionAddress": "",
          "peerList": Array [],
          "port": 0,
          "privateKey": "",
          "registrar": null,
          "registrarUrl": "",
          "rootCa": "",
        },
      ]
    `)
  })

  it('select unregistered communities with user identity without certificate', () => {
    const unregisteredCommunities = identitySelectors.unregisteredCommunities(store.getState())
    const idOfJoinedCommunities = unregisteredCommunities.map(community => community.id)

    expect(idOfJoinedCommunities).toEqual(['communityDelta'])
    expect(unregisteredCommunities).toMatchInlineSnapshot(`
      Array [
        Object {
          "CA": Object {
            "rootCertString": "certString",
            "rootKeyString": "keyString",
          },
          "id": "communityDelta",
          "name": "beta",
          "onionAddress": "",
          "peerList": Array [],
          "port": 0,
          "privateKey": "",
          "registrar": null,
          "registrarUrl": "",
          "rootCa": "",
        },
      ]
    `)
  })

  it('select communities without user identity', () => {
    const unregisteredCommunities = identitySelectors.unregisteredCommunitiesWithoutUserIdentity(
      store.getState()
    )
    const idOfJoinedCommunities = unregisteredCommunities.map(community => community.id)

    expect(idOfJoinedCommunities).toEqual(['communityAlpha'])
    expect(unregisteredCommunities).toMatchInlineSnapshot(`
      Array [
        Object {
          "CA": Object {
            "rootCertString": "certString",
            "rootKeyString": "keyString",
          },
          "id": "communityAlpha",
          "name": "alpha",
          "onionAddress": "",
          "peerList": Array [],
          "port": 0,
          "privateKey": "",
          "registrar": null,
          "registrarUrl": "",
          "rootCa": "",
        },
      ]
    `)
  })
})

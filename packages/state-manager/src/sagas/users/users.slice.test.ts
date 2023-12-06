import { combineReducers, createStore, type Store } from 'redux'
import { StoreKeys } from '../store.keys'
import { communitiesReducer, CommunitiesState } from '../communities/communities.slice'

import { communitiesAdapter } from '../communities/communities.adapter'
import { usersActions, usersReducer, UsersState } from './users.slice'
import { certificatesAdapter } from './users.adapter'
import { keyFromCertificate, parseCertificate } from '@quiet/identity'
import { usersSelectors } from './users.selectors'
import { type Community } from '@quiet/types'

describe('users reducer', () => {
  let store: Store

  const community: Community = {
    name: 'communityId',
    id: 'communityId',
    CA: { rootCertString: 'certString', rootKeyString: 'keyString' },
    rootCa: '',
    peerList: [],
    registrarUrl: '',
    registrar: null,
    onionAddress: '',
    privateKey: '',
    port: 0,
    registrationAttempts: 0,
    ownerCertificate: '',
  }

  beforeEach(() => {
    store = createStore(
      combineReducers({
        [StoreKeys.Communities]: communitiesReducer,
        [StoreKeys.Users]: usersReducer,
      }),
      {
        [StoreKeys.Communities]: {
          ...new CommunitiesState(),
          community: community
        },
        [StoreKeys.Users]: {
          ...new UsersState(),
          certificates: certificatesAdapter.setAll(certificatesAdapter.getInitialState(), []),
        },
      }
    )
  })

  it('responseSendCertificates should set certificates in store', () => {
    const userCertString =
      'MIICDzCCAbUCBgF9Ms+EwTAKBggqhkjOPQQDAjASMRAwDgYDVQQDEwdaYmF5IENBMB4XDTIxMTExODExMzAwMFoXDTMwMDEzMTIzMDAwMFowSTFHMEUGA1UEAxM+bnFudzRrYzRjNzdmYjQ3bGs1Mm01bDU3aDR0Y3hjZW83eW14ZWtmbjd5aDVtNjZ0NGp2Mm9sYWQub25pb24wWTATBgcqhkjOPQIBBggqhkjOPQMBBwNCAAT3mQI3akfoTD3i94ZJZMmZ2RZswEeQ0aW0og+/VuzUJQblVQ+UdH6kuKFjq7BTtdjYTMSCO9wfPotBX88+p2Kuo4HEMIHBMAkGA1UdEwQCMAAwCwYDVR0PBAQDAgCOMB0GA1UdJQQWMBQGCCsGAQUFBwMCBggrBgEFBQcDATAvBgkqhkiG9w0BCQwEIgQgC/tHWBDA4myfq1kNR8PWDsUzuzxFFZasw81PIWAumtkwGAYKKwYBBAGDjBsCAQQKEwh1c2VyTmFtZTA9BgkrBgECAQ8DAQEEMBMuUW1mM3lTa1lxTEVUOXh0QXREenZBcjVQcDNlZ0sxSDNDNWlKQVptMVNwTEVwNjAKBggqhkjOPQQDAgNIADBFAiBYmTIJtW2pARg4WTIVMXs2fvGroBxko71CnUi3Fum1WQIhAM0npNOL0/2+8dRTWRNE61D4jcbtltmXAXFjYbd711hk'
    const parsedCert = parseCertificate(userCertString)
    const userPubKey = keyFromCertificate(parsedCert)

    store.dispatch(
      usersActions.responseSendCertificates({
        certificates: [userCertString],
      })
    )

    store.dispatch(
      usersActions.setAllCerts({
        certificates: [userCertString],
      })
    )

    const certificates = usersSelectors.certificates(store.getState())

    expect(certificates[userPubKey]).toEqual(parsedCert)

    expect(certificates[userPubKey].subject).toMatchInlineSnapshot(`
      Object {
        "typesAndValues": Array [
          Object {
            "type": "2.5.4.3",
            "value": Object {
              "blockLength": 64,
              "blockName": "PrintableString",
              "error": "",
              "idBlock": Object {
                "blockLength": 1,
                "blockName": "identificationBlock",
                "error": "",
                "isConstructed": false,
                "isHexOnly": false,
                "tagClass": 1,
                "tagNumber": 19,
                "valueBeforeDecode": "",
                "valueHex": "",
                "warnings": Array [],
              },
              "lenBlock": Object {
                "blockLength": 1,
                "blockName": "lengthBlock",
                "error": "",
                "isIndefiniteForm": false,
                "length": 62,
                "longFormUsed": false,
                "valueBeforeDecode": "",
                "warnings": Array [],
              },
              "name": "",
              "optional": false,
              "valueBeforeDecode": "133e6e716e77346b6334633737666234376c6b35326d356c3537683474637863656f37796d78656b666e377968356d363674346a76326f6c61642e6f6e696f6e",
              "valueBlock": Object {
                "blockLength": 62,
                "blockName": "SimpleStringValueBlock",
                "error": "",
                "isHexOnly": true,
                "value": "nqnw4kc4c77fb47lk52m5l57h4tcxceo7ymxekfn7yh5m66t4jv2olad.onion",
                "valueBeforeDecode": "",
                "valueHex": "6e716e77346b6334633737666234376c6b35326d356c3537683474637863656f37796d78656b666e377968356d363674346a76326f6c61642e6f6e696f6e",
                "warnings": Array [],
              },
              "warnings": Array [],
            },
          },
        ],
      }
    `)
  })
})

import { combineReducers, createStore, Store } from '@reduxjs/toolkit';
import { StoreKeys } from '../store.keys';

import {
  communitiesReducer,
  CommunitiesState,
  Community,
} from '../communities/communities.slice';

import { usersReducer, UsersState } from '../users/users.slice';

import { communitiesAdapter } from '../communities/communities.adapter';
import { certificatesAdapter } from '../users/users.adapter';
import { keyFromCertificate, parseCertificate } from '@zbayapp/identity/lib';
import { usersSelectors } from './users.selectors';

describe('users selectors', () => {
  let store: Store;

  const communityId: Community = {
    name: 'communityId',
    id: 'communityId',
    CA: {
      rootCertString:
        'MIIBVTCB+wIBATAKBggqhkjOPQQDAjASMRAwDgYDVQQDEwdaYmF5IENBMCYYEzIwMjExMTE4MTEzMDAwLjM4N1oYDzIwMzAwMTMxMjMwMDAwWjASMRAwDgYDVQQDEwdaYmF5IENBMFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEoKzNP5eKZZjlLb+cm+QMR9lUkSKLSRt6JcvOmR5f4ege4cOP9XQhNumf4yVt3siM5cu2r/81V5HIAcbqmbSgU6M/MD0wDwYDVR0TBAgwBgEB/wIBAzALBgNVHQ8EBAMCAIYwHQYDVR0lBBYwFAYIKwYBBQUHAwIGCCsGAQUFBwMBMAoGCCqGSM49BAMCA0kAMEYCIQCY/PaLvdC2otl+PHIGt5F5uzirg7p2km/EQq1eDptmtAIhAPy+JIT4T81l40bKadTQt6977M+fY+Hfc1GfUiJFOZVV',
      rootKeyString:
        'MIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQgWBC3C4ARMT8zD1nqYjfs+bDXflWkVFqHRovqQmLQRAKgCgYIKoZIzj0DAQehRANCAASgrM0/l4plmOUtv5yb5AxH2VSRIotJG3oly86ZHl/h6B7hw4/1dCE26Z/jJW3eyIzly7av/zVXkcgBxuqZtKBT',
    },
    rootCa: '',
    peerList: [],
    registrarUrl: '',
    registrar: null,
    onionAddress: '',
    privateKey: '',
    port: 0,
  };

  const userCertData = {
    username: 'userName',
    onionAddress:
      'nqnw4kc4c77fb47lk52m5l57h4tcxceo7ymxekfn7yh5m66t4jv2olad.onion',
    peerId: 'Qmf3ySkYqLET9xtAtDzvAr5Pp3egK1H3C5iJAZm1SpLEp6',
    dmPublicKey:
      '0bfb475810c0e26c9fab590d47c3d60ec533bb3c451596acc3cd4f21602e9ad9',
  };

  const userCertString =
    'MIICDzCCAbUCBgF9Ms+EwTAKBggqhkjOPQQDAjASMRAwDgYDVQQDEwdaYmF5IENBMB4XDTIxMTExODExMzAwMFoXDTMwMDEzMTIzMDAwMFowSTFHMEUGA1UEAxM+bnFudzRrYzRjNzdmYjQ3bGs1Mm01bDU3aDR0Y3hjZW83eW14ZWtmbjd5aDVtNjZ0NGp2Mm9sYWQub25pb24wWTATBgcqhkjOPQIBBggqhkjOPQMBBwNCAAT3mQI3akfoTD3i94ZJZMmZ2RZswEeQ0aW0og+/VuzUJQblVQ+UdH6kuKFjq7BTtdjYTMSCO9wfPotBX88+p2Kuo4HEMIHBMAkGA1UdEwQCMAAwCwYDVR0PBAQDAgCOMB0GA1UdJQQWMBQGCCsGAQUFBwMCBggrBgEFBQcDATAvBgkqhkiG9w0BCQwEIgQgC/tHWBDA4myfq1kNR8PWDsUzuzxFFZasw81PIWAumtkwGAYKKwYBBAGDjBsCAQQKEwh1c2VyTmFtZTA9BgkrBgECAQ8DAQEEMBMuUW1mM3lTa1lxTEVUOXh0QXREenZBcjVQcDNlZ0sxSDNDNWlKQVptMVNwTEVwNjAKBggqhkjOPQQDAgNIADBFAiBYmTIJtW2pARg4WTIVMXs2fvGroBxko71CnUi3Fum1WQIhAM0npNOL0/2+8dRTWRNE61D4jcbtltmXAXFjYbd711hk';

  const parsedCert = parseCertificate(userCertString);
  const userPubKey = keyFromCertificate(parsedCert);

  beforeEach(() => {
    store = createStore(
      combineReducers({
        [StoreKeys.Communities]: communitiesReducer,
        [StoreKeys.Users]: usersReducer,
      }),
      {
        [StoreKeys.Communities]: {
          ...new CommunitiesState(),
          currentCommunity: 'communityId',
          communities: communitiesAdapter.setAll(
            communitiesAdapter.getInitialState(),
            [communityId]
          ),
        },
        [StoreKeys.Users]: {
          ...new UsersState(),
          certificates: certificatesAdapter.setAll(
            certificatesAdapter.getInitialState(),
            [parsedCert]
          ),
        },
      }
    );
  });

  it('get proper user certificate from store', async () => {
    const certificates = usersSelectors.certificates(store.getState());
    const userCertificate = certificates[userPubKey] || null;

    expect(userCertificate).not.toBeNull();
  });

  it('get proper fields from user certificate', async () => {
    const usersData = usersSelectors.certificatesMapping(store.getState());

    expect(usersData[userPubKey]).toEqual(userCertData);

    expect(usersData[userPubKey]).toMatchInlineSnapshot(`
      Object {
        "dmPublicKey": "0bfb475810c0e26c9fab590d47c3d60ec533bb3c451596acc3cd4f21602e9ad9",
        "onionAddress": "nqnw4kc4c77fb47lk52m5l57h4tcxceo7ymxekfn7yh5m66t4jv2olad.onion",
        "peerId": "Qmf3ySkYqLET9xtAtDzvAr5Pp3egK1H3C5iJAZm1SpLEp6",
        "username": "userName",
      }
    `);
  });
});

export {};

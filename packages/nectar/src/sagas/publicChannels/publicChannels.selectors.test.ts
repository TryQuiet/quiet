import { combineReducers, createStore, Store } from '@reduxjs/toolkit';
import { StoreKeys } from '../store.keys';
import { publicChannelsSelectors } from './publicChannels.selectors';
import { channelsByCommunityAdapter } from './publicChannels.adapter';
import {
  publicChannelsReducer,
  CommunityChannels,
  PublicChannelsState,
} from './publicChannels.slice';

import {
  communitiesReducer,
  CommunitiesState,
  Community,
} from '../communities/communities.slice';

import { usersReducer, UsersState } from '../users/users.slice';

import { communitiesAdapter } from '../communities/communities.adapter';
import { certificatesAdapter } from '../users/users.adapter';
import { keyFromCertificate, parseCertificate } from '@zbayapp/identity/lib';

process.env.TZ = 'UTC';

describe('publicChannelsSelectors', () => {
  let store: Store;

  const communityId = new Community({
    name: 'communityId',
    id: 'communityId',
    CA: {
      rootCertString:
        'MIIBVTCB+wIBATAKBggqhkjOPQQDAjASMRAwDgYDVQQDEwdaYmF5IENBMCYYEzIwMjExMTE4MTEzMDAwLjM4N1oYDzIwMzAwMTMxMjMwMDAwWjASMRAwDgYDVQQDEwdaYmF5IENBMFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEoKzNP5eKZZjlLb+cm+QMR9lUkSKLSRt6JcvOmR5f4ege4cOP9XQhNumf4yVt3siM5cu2r/81V5HIAcbqmbSgU6M/MD0wDwYDVR0TBAgwBgEB/wIBAzALBgNVHQ8EBAMCAIYwHQYDVR0lBBYwFAYIKwYBBQUHAwIGCCsGAQUFBwMBMAoGCCqGSM49BAMCA0kAMEYCIQCY/PaLvdC2otl+PHIGt5F5uzirg7p2km/EQq1eDptmtAIhAPy+JIT4T81l40bKadTQt6977M+fY+Hfc1GfUiJFOZVV',
      rootKeyString:
        'MIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQgWBC3C4ARMT8zD1nqYjfs+bDXflWkVFqHRovqQmLQRAKgCgYIKoZIzj0DAQehRANCAASgrM0/l4plmOUtv5yb5AxH2VSRIotJG3oly86ZHl/h6B7hw4/1dCE26Z/jJW3eyIzly7av/zVXkcgBxuqZtKBT',
    },
    registrarUrl: '',
  });

  let communityChannels = new CommunityChannels('communityId');

  const userCertString1 =
    'MIICDzCCAbUCBgF9Ms+EwTAKBggqhkjOPQQDAjASMRAwDgYDVQQDEwdaYmF5IENBMB4XDTIxMTExODExMzAwMFoXDTMwMDEzMTIzMDAwMFowSTFHMEUGA1UEAxM+bnFudzRrYzRjNzdmYjQ3bGs1Mm01bDU3aDR0Y3hjZW83eW14ZWtmbjd5aDVtNjZ0NGp2Mm9sYWQub25pb24wWTATBgcqhkjOPQIBBggqhkjOPQMBBwNCAAT3mQI3akfoTD3i94ZJZMmZ2RZswEeQ0aW0og+/VuzUJQblVQ+UdH6kuKFjq7BTtdjYTMSCO9wfPotBX88+p2Kuo4HEMIHBMAkGA1UdEwQCMAAwCwYDVR0PBAQDAgCOMB0GA1UdJQQWMBQGCCsGAQUFBwMCBggrBgEFBQcDATAvBgkqhkiG9w0BCQwEIgQgC/tHWBDA4myfq1kNR8PWDsUzuzxFFZasw81PIWAumtkwGAYKKwYBBAGDjBsCAQQKEwh1c2VyTmFtZTA9BgkrBgECAQ8DAQEEMBMuUW1mM3lTa1lxTEVUOXh0QXREenZBcjVQcDNlZ0sxSDNDNWlKQVptMVNwTEVwNjAKBggqhkjOPQQDAgNIADBFAiBYmTIJtW2pARg4WTIVMXs2fvGroBxko71CnUi3Fum1WQIhAM0npNOL0/2+8dRTWRNE61D4jcbtltmXAXFjYbd711hk';

  const userCertString2 =
    'MIICDzCCAbYCBgF9Ms+E5zAKBggqhkjOPQQDAjASMRAwDgYDVQQDEwdaYmF5IENBMB4XDTIxMTExODExMzAwMFoXDTMwMDEzMTIzMDAwMFowSTFHMEUGA1UEAxM+bnFudzRrYzRjNzdmYjQ3bGs0Mm01bDU3aDR0Y3hjZW83eW14ZWtmbjd5aDVtNjZ0NGp2Mm9sYWQub25pb24wWTATBgcqhkjOPQIBBggqhkjOPQMBBwNCAAQjWEwm4RUvFIq4GAEJVY59zGqiULcXSvG+YeF/xwKGbErKYLXZcvfdP0tFN86W91golyWhGLew2ICfewnKMPy+o4HFMIHCMAkGA1UdEwQCMAAwCwYDVR0PBAQDAgCOMB0GA1UdJQQWMBQGCCsGAQUFBwMCBggrBgEFBQcDATAvBgkqhkiG9w0BCQwEIgQgC/tHWBDA4myfq0kNR8PWDsUzuzxFFZasw81PIWAumtkwGQYKKwYBBAGDjBsCAQQLEwl1c2VyTmFtZTIwPQYJKwYBAgEPAwEBBDATLlFtZjN5U2tZcUxFVDl4dEF0RHp2QXI0UHAzZWdLMUgzQzVpSkFabTFTcExFcDYwCgYIKoZIzj0EAwIDRwAwRAIgThBnxCaykLco+jaSw1/Gl+jdU7gmnEIWcDMZAss56bMCIDDuRrQPVyLkSKovRRVbHCcJUogytUaTVo0Mljl7WlMY';

  const parsedCert1 = parseCertificate(userCertString1);
  const parsedCert2 = parseCertificate(userCertString2);

  const userPubKey1 = keyFromCertificate(parsedCert1);
  const userPubKey2 = keyFromCertificate(parsedCert2);

  communityChannels.currentChannel = 'currentChannel';
  communityChannels.channelMessages = {
    currentChannel: {
      ids: ['1', '0', '2', '4', '5', '6', '7', '8'],
      messages: {
        '0': {
          id: '0',
          message: 'message0',
          createdAt: 1637150276, // November 17, 2021 11:57:56
          channelId: '',
          pubKey: userPubKey1,
          signature: '',
          type: 1,
        },
        '2': {
          id: '2',
          message: 'message2',
          createdAt: 1417155000, // November 28, 2014 6:10:00
          channelId: '',
          pubKey: userPubKey1,
          signature: '',
          type: 1,
        },
        '4': {
          id: '4',
          message: 'message4',
          createdAt: 1417155128, // November 28, 2014 6:12:08
          channelId: '',
          pubKey: userPubKey1,
          signature: '',
          type: 1,
        },
        '7': {
          id: '7',
          message: 'message7',
          createdAt: 1417155120, // November 28, 2014 6:12:08
          channelId: '',
          pubKey: userPubKey2,
          signature: '',
          type: 1,
        },
        '5': {
          id: '5',
          message: 'message5',
          createdAt: 1417154000, // November 28, 2014 5:53:20
          channelId: '',
          pubKey: userPubKey1,
          signature: '',
          type: 1,
        },
        '1': {
          id: '1',
          message: 'message1',
          createdAt: 1637157276, // November 17, 2021 12:54:36
          channelId: '',
          pubKey: userPubKey1,
          signature: '',
          type: 1,
        },
        '6': {
          id: '6',
          message: 'message6',
          createdAt: 1417155108, // November 28, 2014 6:11:48
          channelId: '',
          pubKey: userPubKey1,
          signature: '',
          type: 1,
        },
        '8': {
          id: '8',
          message: 'message8',
          createdAt: 1417155107, // November 28, 2014 6:11:48
          channelId: '',
          pubKey: userPubKey1,
          signature: '',
          type: 1,
        },
      },
    },
  };

  beforeEach(() => {
    store = createStore(
      combineReducers({
        [StoreKeys.PublicChannels]: publicChannelsReducer,
        [StoreKeys.Communities]: communitiesReducer,
        [StoreKeys.Users]: usersReducer,
      }),
      {
        [StoreKeys.PublicChannels]: {
          ...new PublicChannelsState(),
          channels: channelsByCommunityAdapter.setAll(
            channelsByCommunityAdapter.getInitialState(),
            [communityChannels]
          ),
        },
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
            [parsedCert1, parsedCert2]
          ),
        },
      }
    );
  });

  it('get messages in proper order', () => {
    const messages = publicChannelsSelectors.orderedChannelMessages(
      store.getState()
    );
    expect(messages).toMatchInlineSnapshot(`
      Array [
        Object {
          "channelId": "",
          "createdAt": 1637157276,
          "id": "1",
          "message": "message1",
          "pubKey": "BPeZAjdqR+hMPeL3hklkyZnZFmzAR5DRpbSiD79W7NQlBuVVD5R0fqS4oWOrsFO12NhMxII73B8+i0Ffzz6nYq4=",
          "signature": "",
          "type": 1,
        },
        Object {
          "channelId": "",
          "createdAt": 1637150276,
          "id": "0",
          "message": "message0",
          "pubKey": "BPeZAjdqR+hMPeL3hklkyZnZFmzAR5DRpbSiD79W7NQlBuVVD5R0fqS4oWOrsFO12NhMxII73B8+i0Ffzz6nYq4=",
          "signature": "",
          "type": 1,
        },
        Object {
          "channelId": "",
          "createdAt": 1417155000,
          "id": "2",
          "message": "message2",
          "pubKey": "BPeZAjdqR+hMPeL3hklkyZnZFmzAR5DRpbSiD79W7NQlBuVVD5R0fqS4oWOrsFO12NhMxII73B8+i0Ffzz6nYq4=",
          "signature": "",
          "type": 1,
        },
        Object {
          "channelId": "",
          "createdAt": 1417155128,
          "id": "4",
          "message": "message4",
          "pubKey": "BPeZAjdqR+hMPeL3hklkyZnZFmzAR5DRpbSiD79W7NQlBuVVD5R0fqS4oWOrsFO12NhMxII73B8+i0Ffzz6nYq4=",
          "signature": "",
          "type": 1,
        },
        Object {
          "channelId": "",
          "createdAt": 1417154000,
          "id": "5",
          "message": "message5",
          "pubKey": "BPeZAjdqR+hMPeL3hklkyZnZFmzAR5DRpbSiD79W7NQlBuVVD5R0fqS4oWOrsFO12NhMxII73B8+i0Ffzz6nYq4=",
          "signature": "",
          "type": 1,
        },
        Object {
          "channelId": "",
          "createdAt": 1417155108,
          "id": "6",
          "message": "message6",
          "pubKey": "BPeZAjdqR+hMPeL3hklkyZnZFmzAR5DRpbSiD79W7NQlBuVVD5R0fqS4oWOrsFO12NhMxII73B8+i0Ffzz6nYq4=",
          "signature": "",
          "type": 1,
        },
        Object {
          "channelId": "",
          "createdAt": 1417155120,
          "id": "7",
          "message": "message7",
          "pubKey": "BCNYTCbhFS8UirgYAQlVjn3MaqJQtxdK8b5h4X/HAoZsSspgtdly990/S0U3zpb3WCiXJaEYt7DYgJ97Ccow/L4=",
          "signature": "",
          "type": 1,
        },
        Object {
          "channelId": "",
          "createdAt": 1417155107,
          "id": "8",
          "message": "message8",
          "pubKey": "BPeZAjdqR+hMPeL3hklkyZnZFmzAR5DRpbSiD79W7NQlBuVVD5R0fqS4oWOrsFO12NhMxII73B8+i0Ffzz6nYq4=",
          "signature": "",
          "type": 1,
        },
      ]
    `);
  });

  it('get grouped messages', async () => {
    const messages = publicChannelsSelectors.currentChannelMessagesGroupedByDay(
      store.getState()
    );

    expect(messages).toMatchInlineSnapshot(`
      Array [
        Object {
          "day": "Nov 28",
          "messages": Array [
            Object {
              "createdAt": " 5:53 AM",
              "id": "5",
              "message": "message5",
              "nickname": "userName",
              "type": 1,
            },
            Object {
              "createdAt": " 6:11 AM",
              "id": "6",
              "message": "message2
      message8
      message6",
              "nickname": "userName",
              "type": 1,
            },
            Object {
              "createdAt": " 6:12 AM",
              "id": "7",
              "message": "message7",
              "nickname": "userName2",
              "type": 1,
            },
            Object {
              "createdAt": " 6:12 AM",
              "id": "4",
              "message": "message4",
              "nickname": "userName",
              "type": 1,
            },
          ],
        },
        Object {
          "day": "Nov 17",
          "messages": Array [
            Object {
              "createdAt": " 11:57 AM",
              "id": "0",
              "message": "message0",
              "nickname": "userName",
              "type": 1,
            },
            Object {
              "createdAt": " 1:54 PM",
              "id": "1",
              "message": "message1",
              "nickname": "userName",
              "type": 1,
            },
          ],
        },
      ]
    `);
  });
});

export {};

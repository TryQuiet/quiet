import { Store } from '../store.types';
import { getFactory } from '../..';
import { prepareStore } from '../../utils/tests/prepareStore';
import {
  currentChannelMessagesMergedBySender,
  sortedCurrentChannelMessages,
} from './publicChannels.selectors';
import { publicChannelsActions } from './publicChannels.slice';
import { communitiesActions } from '../communities/communities.slice';
import { identityActions } from '../identity/identity.slice';
import { DateTime } from 'luxon';
import { MessageType } from '../messages/messages.types';

process.env.TZ = 'UTC';

describe('publicChannelsSelectors', () => {
  let store: Store;

  beforeAll(async () => {
    store = prepareStore().store;

    const factory = await getFactory(store);

    const community = await factory.create<
      ReturnType<typeof communitiesActions.addNewCommunity>['payload']
    >('Community');

    const holmes = await factory.create<
      ReturnType<typeof identityActions.addNewIdentity>['payload']
    >('Identity', { id: community.id, zbayNickname: 'holmes' });

    const bartek = await factory.create<
      ReturnType<typeof identityActions.addNewIdentity>['payload']
    >('Identity', { id: community.id, zbayNickname: 'bartek' });

    /* Messages ids are being used only for veryfing proper order...
    ...they have no impact on selectors work */
    const messages = [
      {
        id: '1',
        createdAt: DateTime.fromObject({
          year: 2020,
          month: 10,
          day: 20,
          hour: 5,
          minute: 50,
        }).toSeconds(),
        identity: holmes,
      },
      {
        id: '2',
        createdAt: DateTime.fromObject({
          year: 2020,
          month: 10,
          day: 20,
          hour: 6,
          minute: 10,
        }).toSeconds(),
        identity: holmes,
      },
      {
        id: '3',
        createdAt: DateTime.fromObject({
          year: 2020,
          month: 10,
          day: 20,
          hour: 6,
          minute: 11,
          second: 30,
          millisecond: 1,
        }).toSeconds(),
        identity: holmes,
      },
      {
        id: '4',
        createdAt: DateTime.fromObject({
          year: 2020,
          month: 10,
          day: 20,
          hour: 6,
          minute: 11,
          second: 30,
          millisecond: 2,
        }).toSeconds(),
        identity: holmes,
      },
      {
        id: '5',
        createdAt: DateTime.fromObject({
          year: 2020,
          month: 10,
          day: 20,
          hour: 6,
          minute: 12,
          second: 1,
        }).toSeconds(),
        identity: bartek,
      },
      {
        id: '6',
        createdAt: DateTime.fromObject({
          year: 2020,
          month: 10,
          day: 20,
          hour: 6,
          minute: 12,
          second: 2,
        }).toSeconds(),
        identity: holmes,
      },
      {
        id: '7',
        createdAt: DateTime.fromObject({
          year: 2021,
          month: 2,
          day: 5,
          hour: 18,
          minute: 2,
        }).toSeconds(),
        identity: holmes,
      },
      {
        id: '8',
        createdAt: DateTime.fromObject({
          year: 2021,
          month: 2,
          day: 5,
          hour: 20,
          minute: 50,
        }).toSeconds(),
        identity: holmes,
      },
      {
        id: '9',
        createdAt: DateTime.fromObject({
          year: DateTime.now().year,
          month: DateTime.now().month,
          day: DateTime.now().day,
          hour: 20,
          minute: 50,
        }).toSeconds(),
        identity: holmes,
      },
    ];

    // Shuffle messages array
    const shuffled = messages
      .map((value) => ({ value, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map(({ value }) => value);

    for (const item of shuffled) {
      await factory.create<
        ReturnType<typeof publicChannelsActions.signMessage>['payload']
      >('SignedMessage', {
        identity: item.identity,
        message: {
          id: item.id,
          type: MessageType.Basic,
          message: `message_${item.id}`,
          createdAt: item.createdAt,
          channelId: 'general',
          signature: '',
          pubKey: '',
        },
      });
    }
  });

  it('get messages sorted by date', async () => {
    const messages = sortedCurrentChannelMessages(store.getState());
    messages.forEach((message) => {
      expect(message).toMatchSnapshot({
        pubKey: expect.any(String),
        signature: expect.any(String),
      });
    });
  });

  it('get grouped messages', async () => {
    const messages = currentChannelMessagesMergedBySender(store.getState());
    expect(messages).toMatchInlineSnapshot(`
Object {
  "Feb 05": Array [
    Array [
      Object {
        "createdAt": 1612548120,
        "date": "Feb 05, 18:02",
        "id": "7",
        "message": "message_7",
        "nickname": "holmes",
        "type": 1,
      },
      Object {
        "createdAt": 1612558200,
        "date": "Feb 05, 20:50",
        "id": "8",
        "message": "message_8",
        "nickname": "holmes",
        "type": 1,
      },
    ],
  ],
  "Oct 20": Array [
    Array [
      Object {
        "createdAt": 1603173000,
        "date": "Oct 20, 5:50",
        "id": "1",
        "message": "message_1",
        "nickname": "holmes",
        "type": 1,
      },
      Object {
        "createdAt": 1603174200,
        "date": "Oct 20, 6:10",
        "id": "2",
        "message": "message_2",
        "nickname": "holmes",
        "type": 1,
      },
      Object {
        "createdAt": 1603174290.001,
        "date": "Oct 20, 6:11",
        "id": "3",
        "message": "message_3",
        "nickname": "holmes",
        "type": 1,
      },
      Object {
        "createdAt": 1603174290.002,
        "date": "Oct 20, 6:11",
        "id": "4",
        "message": "message_4",
        "nickname": "holmes",
        "type": 1,
      },
    ],
    Array [
      Object {
        "createdAt": 1603174321,
        "date": "Oct 20, 6:12",
        "id": "5",
        "message": "message_5",
        "nickname": "bartek",
        "type": 1,
      },
    ],
    Array [
      Object {
        "createdAt": 1603174322,
        "date": "Oct 20, 6:12",
        "id": "6",
        "message": "message_6",
        "nickname": "holmes",
        "type": 1,
      },
    ],
  ],
  "Today": Array [
    Array [
      Object {
        "createdAt": 1638391800,
        "date": "20:50",
        "id": "9",
        "message": "message_9",
        "nickname": "holmes",
        "type": 1,
      },
    ],
  ],
}
`);
  });
});

export {};

import {combineReducers, createStore, Store} from 'redux';
import {StoreKeys} from '../store.keys';
import {publicChannelsSelectors} from './publicChannels.selectors';
import {
  publicChannelsActions,
  publicChannelsReducer,
} from './publicChannels.slice';

const mockGetPublicChannels = {
  public: {
    address:
      'zs1ppz4qxctnv85ycex7u4cyxatz2wnduzy7usvyagma6h45lwrx88pdl3mdu25z763uvfy7a0qpfs',
    description: 'public chat',
    name: 'public',
    owner: '030fdc016427a6e41ca8dccaf0c09cfbf002e5916a13ee16f5fe7240d0dfe50ede',
    timestamp: 1587010998,
  },
  zbay: {
    address:
      'zs10zkaj29rcev9qd5xeuzck4ly5q64kzf6m6h9nfajwcvm8m2vnjmvtqgr0mzfjywswwkwke68t00',
    description: 'zbay marketplace channel',
    name: 'zbay',
    owner: '030fdc016427a6e41ca8dccaf0c09cfbf002e5916a13ee16f5fe7240d0dfe50ede',
    timestamp: 1587009699,
  },
};

describe('publicChannelsReducer', () => {
  let store: Store;
  beforeEach(() => {
    store = createStore(
      combineReducers({
        [StoreKeys.PublicChannels]: publicChannelsReducer,
      }),
    );
  });

  it('responseGetPublicChannels should set channels info', () => {
    store.dispatch(
      publicChannelsActions.responseGetPublicChannels(mockGetPublicChannels),
    );
    const channels = publicChannelsSelectors.publicChannels(store.getState());
    expect(channels).toMatchInlineSnapshot(`
      Array [
        Object {
          "address": "zs1ppz4qxctnv85ycex7u4cyxatz2wnduzy7usvyagma6h45lwrx88pdl3mdu25z763uvfy7a0qpfs",
          "description": "public chat",
          "name": "public",
          "owner": "030fdc016427a6e41ca8dccaf0c09cfbf002e5916a13ee16f5fe7240d0dfe50ede",
          "timestamp": 1587010998,
        },
        Object {
          "address": "zs10zkaj29rcev9qd5xeuzck4ly5q64kzf6m6h9nfajwcvm8m2vnjmvtqgr0mzfjywswwkwke68t00",
          "description": "zbay marketplace channel",
          "name": "zbay",
          "owner": "030fdc016427a6e41ca8dccaf0c09cfbf002e5916a13ee16f5fe7240d0dfe50ede",
          "timestamp": 1587009699,
        },
      ]
    `);
  });
});

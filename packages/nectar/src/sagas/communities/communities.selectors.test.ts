import { combineReducers, createStore, Store } from '@reduxjs/toolkit';
import { StoreKeys } from '../store.keys';
import { communitiesAdapter } from './communities.adapter';
import { communitiesSelectors } from './communities.selectors';
import {
  communitiesReducer,
  CommunitiesState,
  Community,
} from './communities.slice';

describe('communitiesSelectors', () => {
  let store: Store;
  const communityAlpha = new Community({
    name: 'alpha',
    id: 'communityAlpha',
    CA: { rootCertString: 'certString', rootKeyString: 'keyString' },
    registrarUrl: '',
  });
  const communityBeta = new Community({
    name: 'beta',
    id: 'communityBeta',
    CA: { rootCertString: 'certString', rootKeyString: 'keyString' },
    registrarUrl: '',
  });
  beforeEach(() => {
    store = createStore(
      combineReducers({
        [StoreKeys.Communities]: communitiesReducer,
      }),
      {
        [StoreKeys.Communities]: {
          ...new CommunitiesState(),
          currentCommunity: 'communityAlpha',
          communities: communitiesAdapter.setAll(
            communitiesAdapter.getInitialState(),
            [communityAlpha, communityBeta]
          ),
        },
      }
    );
  });

  it('select community by id', () => {
    const community = communitiesSelectors.selectById('communityBeta')(
      store.getState()
    );
    expect(community).toMatchInlineSnapshot(`
      Community {
        "CA": Object {
          "rootCertString": "certString",
          "rootKeyString": "keyString",
        },
        "id": "communityBeta",
        "name": "beta",
        "onionAddress": "",
        "peerList": Array [],
        "privateKey": "",
      }
      `);
  });

    it('select current commnity id', () => {
      const communityId = communitiesSelectors.currentCommunityId(store.getState());
      expect(communityId).toMatchInlineSnapshot(
      `"communityAlpha"`
      );
    });
    it('select current community', () => {
      const community = communitiesSelectors.currentCommunity(store.getState());
      expect(community).toMatchInlineSnapshot(`
      Community {
        "CA": Object {
          "rootCertString": "certString",
          "rootKeyString": "keyString",
        },
        "id": "communityAlpha",
        "name": "alpha",
        "onionAddress": "",
        "peerList": Array [],
        "privateKey": "",
      }
      `);
    });
});

import { createSelector } from '@reduxjs/toolkit';
import { StoreKeys } from '../store.keys';
import { selectorsFactory } from '../store.utils';
import { IdentityState } from './identity.slice';

import { call, select, put } from 'typed-redux-saga';


import { selectReducer } from '../store.utils';
import { identityAdapter } from './identity.adapter';
import { communitiesSelectors } from '../communities/communities.selectors';

// export const identitySelectors = selectorsFactory(
//   StoreKeys.Identity,
//   IdentityState
// );

const selectSelf = (state) => state

export const selectById = () =>
  createSelector(selectSelf, (reducerState) => {
    console.log('inside reducer')
    console.log(reducerState)
    const id = reducerState.Communities.currentCommunity
    console.log(id,'id inside selector')
    const selected = identityAdapter.getSelectors().selectById(reducerState.Identity, id)
    console.log(selected,'selected')
    return selected
  }
  );

export const identitySelectors = {
  selectById
}
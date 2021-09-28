import { createSelector } from '@reduxjs/toolkit';
import { identityAdapter } from './identity.adapter';

const selectSelf = (state) => state;

export const currentIdentity = createSelector(selectSelf, (reducerState) => {
  const id = reducerState.Communities.currentCommunity;
  const selected = identityAdapter
    .getSelectors()
    .selectById(reducerState.Identity, id);
  return selected;
});

export const identitySelectors = {
  currentIdentity,
};

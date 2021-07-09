import { StoreKeys } from '../store.keys';
import { selectorsFactory } from '../store.utils';
import { IdentityState } from './identity.slice';

export const identitySelectors = selectorsFactory(
  StoreKeys.Identity,
  IdentityState,
);

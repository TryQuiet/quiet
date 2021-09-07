import { createEntityAdapter } from '@reduxjs/toolkit';
import { IIdentity } from './identity.types';

export const identityAdapter = createEntityAdapter<IIdentity>({
  selectId: (identity) => identity.id,
});
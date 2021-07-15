import { createSlice, EntityState, PayloadAction } from '@reduxjs/toolkit';
import { parseCertificate } from '@zbayapp/identity/lib';
import Certificate from 'pkijs/src/Certificate';
import { StoreKeys } from '../store.keys';
import { certificatesAdapter } from './users.adapter';

export class UsersState {
  public certificates: EntityState<Certificate> =
    certificatesAdapter.getInitialState();
}

export interface User {
  username: string;
  onionAddress: string;
  peerId: string;
}

export interface SendCertificatesResponse {
  certificates: string[];
}

export const usersSlice = createSlice({
  initialState: { ...new UsersState() },
  name: StoreKeys.Users,
  reducers: {
    responseSendCertificates: (
      state,
      action: PayloadAction<SendCertificatesResponse>,
    ) => {
      certificatesAdapter.setAll(
        state.certificates,
        Object.values(action.payload.certificates).map(item => {
          if (!item) {
            return;
          }
          return parseCertificate(item);
        }),
      );
    },
  },
});

export const usersActions = usersSlice.actions;
export const usersReducer = usersSlice.reducer;

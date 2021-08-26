import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { StoreKeys } from '../store.keys';

import { KeyObject } from 'crypto';
import { OnionData } from '../init/init.slice';

export class IdentityState {
  public zbayNickname: string = '';
  public commonName: string = '';
  public commonKey: string = 'NEW:BEST';
  public peerId: string = '';
  public userCsr: UserCsr | null = null;
  public userCertificate: string | null = null;
}

export interface UserCsr {
  userCsr: string;
  userKey: string;
  pkcs10: CertData;
}

interface CertData {
  publicKey: KeyObject;
  privateKey: KeyObject;
  pkcs10: any;
}

export interface CreateUserCsrPayload {
  zbayNickname: string;
  commonName: string;
  peerId: string;
  dmPublicKey: string;
  signAlg: string;
  hashAlg: string;
}

export const identitySlice = createSlice({
  initialState: { ...new IdentityState() },
  name: StoreKeys.Identity,
  reducers: {
    storeCommonData: (state, action: PayloadAction<OnionData>) => {
      state.commonName = action.payload.address;
      state.commonKey = action.payload.key;
    },
    requestPeerId: state => state,
    storePeerId: (state, action: PayloadAction<string>) => {
      state.peerId = action.payload;
    },
    registerUsername: (state, action: PayloadAction<string>) => {
      // Store nickname in this step as it won't be returned by waggle after being saved to db
      state.zbayNickname = action.payload;
    },
    createUserCsr: (state, _action: PayloadAction<CreateUserCsrPayload>) =>
      state,
    storeUserCsr: (state, action: PayloadAction<UserCsr>) => {
      state.userCsr = action.payload;
    },
    storeUserCertificate: (state, action: PayloadAction<string>) => {
      state.userCertificate = action.payload;
    },
    throwIdentityError: (state, _action: PayloadAction<string>) => state,
  },
});

export const identityActions = identitySlice.actions;
export const identityReducer = identitySlice.reducer;

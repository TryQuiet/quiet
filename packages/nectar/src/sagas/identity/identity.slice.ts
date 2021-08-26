import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { generateDmKeyPair } from '../../utils/cryptography/cryptography';

import { KeyObject } from 'crypto';
import { StoreKeys } from '../store.keys';

export class IdentityState {

  constructor() {
    const dmKeyPair = generateDmKeyPair()
    this.dmPublicKey = dmKeyPair.dmPublicKey,
    this.dmPrivateKey = dmKeyPair.dmPrivateKey
  }

  public zbayNickname: string = '';

  public commonName: string = '';

  public peerId: string = '';

  public dmPublicKey: string

  public dmPrivateKey: string

  public userCsr: UserCsr | null = null;

  public userCertificate: string | null = null;
}

interface CertData {
  publicKey: any;
  privateKey: any;
  pkcs10: any;
}

export interface UserCsr {
  userCsr: string;
  userKey: string;
  pkcs10: CertData;
}

export interface CreateDmKeyPairPayload {
  dmPublicKey: string;
  dmPrivateKey: string;
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
    storeCommonName: (state, action: PayloadAction<string>) => {
      state.commonName = action.payload;
    },
    requestPeerId: (state) => state,
    storePeerId: (state, action: PayloadAction<string>) => {
      state.peerId = action.payload;
    },
    registerUsername: (state, action: PayloadAction<string>) => {
      // Store nickname in this step as it won't be returned by waggle after being saved to db
      state.zbayNickname = action.payload;
    },
    createDmKeyPair: (state, action: PayloadAction<CreateDmKeyPairPayload>) => {
      (state.dmPublicKey = action.payload.dmPublicKey),
        (state.dmPrivateKey = action.payload.dmPrivateKey);
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

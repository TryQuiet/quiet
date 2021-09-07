import {
  createImmutableStateInvariantMiddleware,
  createSlice,
  EntityState,
  PayloadAction,
} from '@reduxjs/toolkit';
import { generateDmKeyPair } from '../../utils/cryptography/cryptography';

import { identityAdapter } from './identity.adapter';

import { KeyObject } from 'crypto';
import { StoreKeys } from '../store.keys';
import { IIdentity } from './identity.types';
import { identityMasterSaga } from './identity.master.saga';
import { identity } from 'src';

export class IdentityState {
  public identities: EntityState<IIdentity> = identityAdapter.getInitialState();
}

export class Identity {
  constructor({id, hiddenService, peerId}) {
      this.id = id,
      this.dmKeys = generateDmKeyPair(),
      this.peerId = peerId,
      this.hiddenService = hiddenService
  }

  public id: string = '';

  public zbayNickname: string = '';

  public hiddenService :{
  address: string,
  privateKey: string
  }
  public dmKeys: {
    publicKey: string,
    privateKey: string
  }

  public peerId: {
    id: string,
    privateKey: string
  }

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
  initialState: identityAdapter.getInitialState(),
  name: StoreKeys.Identity,
  reducers: {
    addNewIdentity: (
      state,
      action: PayloadAction<{ id: string, hiddenService: string, peerId: string}>
    ) => {
      console.log('addNewIdentity');
      identityAdapter.addOne(
        state,
        new Identity(action.payload)
      );
    },
    createUserCsr: (state, _action: PayloadAction<CreateUserCsrPayload>) =>
      state,
    registerUsername: (state, _action: PayloadAction<any>) =>
      state,
    storeUserCsr: (
      state,
      action: PayloadAction<{ userCsr: UserCsr; communityId: string }>
    ) => {
      identityAdapter.updateOne(state, {
        id: action.payload.communityId,
        changes: {
          userCsr: action.payload.userCsr,
        }
      });
    },
    storeUserCertificate: (
      state,
      action: PayloadAction<{ userCertificate: string; communityId: string }>
    ) => {
      identityAdapter.updateOne(state, {
        id: action.payload.communityId,
        changes: {userCertificate: action.payload.userCertificate}
      });
    },
    throwIdentityError: (state, _action: PayloadAction<string>) => state,
  },
});

export const identityActions = identitySlice.actions;
export const identityReducer = identitySlice.reducer;

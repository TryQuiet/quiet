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
  constructor({id, hiddenService, peerId, hiddenServicePrivateKey, peerIdPrivateKey}) {
    const dmKeyPair = generateDmKeyPair();
    (this.dmPublicKey = dmKeyPair.dmPublicKey),
      (this.dmPrivateKey = dmKeyPair.dmPrivateKey),
      (this.community = id);
      this.commonName = hiddenService,
      this.peerId = peerId,
      this.peerIdPrivateKey = peerIdPrivateKey
      this.hiddenServicePrivateKey = hiddenServicePrivateKey
  }

  public community: string = '';

  public zbayNickname: string = '';

  public commonName: string = '';

  public peerId: string = '';

  public peerIdPrivateKey: string = ''

  public dmPublicKey: string;

  public dmPrivateKey: string;

  public userCsr: UserCsr | null = null;

  public hiddenServicePrivateKey: string = ''

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
    updateCommonName: (
      state,
      action: PayloadAction<{ communityId: string; commonName: string }>
    ) => {
      identityAdapter.updateOne(state, {
        id: action.payload.communityId,
        changes: {
          commonName: action.payload.commonName,
        },
      });
    },
    addNewIdentity: (
      state,
      action: PayloadAction<{ id: string, hiddenService: string, hiddenServicePrivateKey: string, peerId: string, peerIdPrivateKey: string}>
    ) => {
      console.log('addNewIdentity');
      identityAdapter.addOne(
        state,
        new Identity(action.payload)
      );
    },
    requestPeerId: (state) => state,
    updatePeerId: (
      state,
      action: PayloadAction<{ communityId: string; peerId: string }>
    ) => {
      identityAdapter.updateOne(state, {
        id: action.payload.communityId,
        changes: {
          peerId: action.payload.peerId,
        }
      });
    },
    createUserCsr: (state, _action: PayloadAction<CreateUserCsrPayload>) =>
      state,
    storeUserCsr: (
      state,
      action: PayloadAction<{ userCsr: UserCsr; communityId: string }>
    ) => {
      identityAdapter.updateOne(state[action.payload.communityId], {
        ...state[action.payload.communityId],
        userCsr: action.payload.userCsr,
      });
    },
    storeUserCertificate: (
      state,
      action: PayloadAction<{ userCertificate: string; communityId: string }>
    ) => {
      identityAdapter.updateOne(state[action.payload.communityId], {
        ...state[action.payload.communityId],
        userCertificate: action.payload.userCertificate,
      });
    },
    throwIdentityError: (state, _action: PayloadAction<string>) => state,
  },
});

export const identityActions = identitySlice.actions;
export const identityReducer = identitySlice.reducer;

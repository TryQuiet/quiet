import { createSlice, EntityState, PayloadAction } from '@reduxjs/toolkit';
import { identityAdapter } from './identity.adapter';
import { StoreKeys } from '../store.keys';

export class IdentityState {
  public identities: EntityState<Identity> = identityAdapter.getInitialState();
}

export interface Identity {
  id: string;
  zbayNickname: string;
  hiddenService: HiddenService;
  dmKeys: DmKeys;
  peerId: PeerId;
  userCsr: UserCsr | null;
  userCertificate: string | null;
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

export interface HiddenService {
  onionAddress: string;
  privateKey: string;
}

export interface PeerId {
  id: string;
  pubKey: string;
  privKey: string;
}

export interface DmKeys {
  publicKey: string;
  privateKey: string;
}

export interface CreateUserCsrPayload {
  zbayNickname: string;
  commonName: string;
  peerId: string;
  dmPublicKey: string;
  signAlg: string;
  hashAlg: string;
}

export interface UpdateUsernamePayload {
  communityId: string;
  nickname: string;
}

export interface StoreUserCertificatePayload {
  userCertificate: string;
  communityId: string;
}

export interface StoreUserCsrPayload {
  userCsr: UserCsr;
  communityId: string;
  registrarAddress: string;
}

export const identitySlice = createSlice({
  initialState: { ...new IdentityState() },
  name: StoreKeys.Identity,
  reducers: {
    addNewIdentity: (state, action: PayloadAction<Identity>) => {
      identityAdapter.addOne(state.identities, action.payload);
    },
    createUserCsr: (state, _action: PayloadAction<CreateUserCsrPayload>) =>
      state,
    saveOwnerCertToDb: (state, _action: PayloadAction<string>) => state,
    savedOwnerCertificate: (state, _action: PayloadAction<string>) => state,
    registerUsername: (state, _action: PayloadAction<string>) => state,
    updateUsername: (state, action: PayloadAction<UpdateUsernamePayload>) => {
      identityAdapter.updateOne(state.identities, {
        id: action.payload.communityId,
        changes: {
          zbayNickname: action.payload.nickname,
        },
      });
    },
    storeUserCsr: (state, action: PayloadAction<StoreUserCsrPayload>) => {
      identityAdapter.updateOne(state.identities, {
        id: action.payload.communityId,
        changes: {
          userCsr: action.payload.userCsr,
        },
      });
    },
    storeUserCertificate: (
      state,
      action: PayloadAction<StoreUserCertificatePayload>
    ) => {
      identityAdapter.updateOne(state.identities, {
        id: action.payload.communityId,
        changes: { userCertificate: action.payload.userCertificate },
      });
    },
    throwIdentityError: (state, _action: PayloadAction<string>) => state,
  },
});

export const identityActions = identitySlice.actions;
export const identityReducer = identitySlice.reducer;

import { createSlice, EntityState, PayloadAction } from '@reduxjs/toolkit';
import { identityAdapter } from './identity.adapter';
import { StoreKeys } from '../store.keys';

export class IdentityState {
  public identities: EntityState<Identity> = identityAdapter.getInitialState();
}

export class Identity {
  constructor({ id, hiddenService, peerId, dmKeys }: AddNewIdentityPayload) {
    (this.id = id),
      (this.peerId = peerId),
      (this.hiddenService = hiddenService);
    this.dmKeys = dmKeys;
  }

  public id: string = '';

  public zbayNickname: string = '';

  public hiddenService: HiddenService;

  public dmKeys: DmKeys;

  public peerId: PeerId;

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

export interface AddNewIdentityPayload {
  id: string;
  hiddenService: HiddenService;
  peerId: PeerId;
  dmKeys: DmKeys;
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
  initialState: identityAdapter.getInitialState(),
  name: StoreKeys.Identity,
  reducers: {
    addNewIdentity: (state, action: PayloadAction<AddNewIdentityPayload>) => {
      identityAdapter.addOne(state, new Identity(action.payload));
    },
    createUserCsr: (state, _action: PayloadAction<CreateUserCsrPayload>) =>
      state,
    saveOwnerCertToDb: (state, _action: PayloadAction<string>) => state,
    savedOwnerCertificate: (state, _action: PayloadAction<string>) => state,
    registerUsername: (state, _action: PayloadAction<string>) => state,
    updateUsername: (state, action: PayloadAction<UpdateUsernamePayload>) => {
      identityAdapter.updateOne(state, {
        id: action.payload.communityId,
        changes: {
          zbayNickname: action.payload.nickname,
        },
      });
    },
    storeUserCsr: (state, action: PayloadAction<StoreUserCsrPayload>) => {
      identityAdapter.updateOne(state, {
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
      identityAdapter.updateOne(state, {
        id: action.payload.communityId,
        changes: { userCertificate: action.payload.userCertificate },
      });
    },
    throwIdentityError: (state, _action: PayloadAction<string>) => state,
  },
});

export const identityActions = identitySlice.actions;
export const identityReducer = identitySlice.reducer;

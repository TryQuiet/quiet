import {
  createImmutableStateInvariantMiddleware,
  createSlice,
  EntityState,
  PayloadAction,
} from '@reduxjs/toolkit';
import { generateDmKeyPair } from '../../utils/cryptography/cryptography';
import { identityAdapter } from './identity.adapter';
import { StoreKeys } from '../store.keys';


export class IdentityState {
  public identities: EntityState<Identity> = identityAdapter.getInitialState();
}

export class Identity {
  constructor({id, hiddenService, peerId}: AddNewIdentityPayload) {
      this.id = id,
      this.dmKeys = generateDmKeyPair(),
      this.peerId = peerId,
      this.hiddenService = hiddenService
  }

  public id: string = '';

  public zbayNickname: string = '';

  public hiddenService : HiddenService
  public dmKeys: {
    publicKey: string,
    privateKey: string
  }

  public peerId: PeerId

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
onionAddress: string,
privateKey: string
}

export interface PeerId {
id: string,
pubKey: string,
privKey: string
}

export interface AddNewIdentityPayload {
  id: string,
  hiddenService: HiddenService,
  peerId: PeerId
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
      action: PayloadAction<AddNewIdentityPayload>
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

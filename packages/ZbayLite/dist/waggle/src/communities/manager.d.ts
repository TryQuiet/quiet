import PeerId, { JSONPeerId } from 'peer-id';
import { ConnectionsManager } from '../libp2p/connectionsManager';
import { Storage } from '../storage';
import { CertificateRegistration } from '../registration';
import { Certificates, InitCommunityPayload, PermsData } from '@zbayapp/nectar';
interface HiddenServiceData {
    onionAddress: string;
    privateKey?: string;
    port?: number;
}
interface InitStorageParams {
    communityId: string;
    peerId: PeerId;
    onionAddress: string;
    virtPort: number;
    targetPort: number;
    peers: string[];
    certs: Certificates;
}
interface CommunityData {
    hiddenService: HiddenServiceData;
    peerId: JSONPeerId;
    localAddress: string;
}
interface Community {
    storage: Storage;
    registrar?: CertificateRegistration;
}
export default class CommunitiesManager {
    connectionsManager: ConnectionsManager;
    communities: Map<string, Community>;
    constructor(connectionsManager: ConnectionsManager);
    getStorage(peerId: string): Storage;
    getCommunity(peerId: string): Community;
    create: (certs: Certificates, communityId: string) => Promise<CommunityData>;
    launch: (payload: InitCommunityPayload) => Promise<string>;
    initStorage: (params: InitStorageParams) => Promise<string>;
    closeStorages: () => Promise<void>;
    stopRegistrars: () => Promise<void>;
    setupRegistrationService: (peerId: string, storage: Storage, permsData: PermsData, hiddenServicePrivKey?: string, port?: number) => Promise<CertificateRegistration>;
}
export {};

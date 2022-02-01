import { PermsData } from '@zbayapp/nectar';
import { Storage } from '../storage';
import { Tor } from '../torManager';
export declare class CertificateRegistration {
    private readonly _app;
    private _server;
    private _port;
    private _privKey;
    private readonly tor;
    private readonly _storage;
    private _onionAddress;
    private readonly _permsData;
    constructor(tor: Tor, storage: Storage, permsData: PermsData, hiddenServicePrivKey?: string, port?: number);
    private setRouting;
    getHiddenServiceData(): {
        privateKey: string;
        onionAddress: string;
        port?: undefined;
    } | {
        privateKey: string;
        onionAddress: string;
        port: number;
    };
    saveOwnerCertToDb(userCert: string): Promise<string>;
    static registerOwnerCertificate(userCsr: string, permsData: PermsData): Promise<string>;
    getPeers(): Promise<string[]>;
    private registerUser;
    private registerCertificate;
    init(): Promise<void>;
    listen(): Promise<void>;
    stop(): Promise<void>;
}

import AccessController from 'orbit-db-access-controllers/src/access-controller-interface';
export declare class MessagesAccessController extends AccessController {
    private readonly crypto;
    private readonly keyMapping;
    static get type(): string;
    canAppend(entry: any): Promise<boolean>;
    save(): Promise<string>;
    static create(_orbitdb: any, _options: any): Promise<MessagesAccessController>;
}

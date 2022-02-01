import { Store } from '../../sagas/store.types';
export declare class CustomReduxAdapter {
    store: Store;
    constructor(store: Store);
    build<T>(Action: any, payload?: Partial<T>): any;
    save(action: any): Promise<any>;
    get(payload: any, attr: any, _payload: any): any;
    set(props: any, payload: any, _payload: any): any;
}

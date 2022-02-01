import factoryGirl from 'factory-girl';
import { Store } from '../../sagas/store.types';
export declare const getFactory: (store: Store) => Promise<factoryGirl.FactoryGirl>;

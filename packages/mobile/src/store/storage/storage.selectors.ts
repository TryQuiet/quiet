import {StoreKeys} from '../store.keys';
import {selectorsFactory} from '../store.utils';
import {StorageState} from './storage.slice';

export const storageSelectors = selectorsFactory(
  StoreKeys.Storage,
  StorageState,
);

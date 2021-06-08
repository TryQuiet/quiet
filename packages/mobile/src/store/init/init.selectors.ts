import { StoreKeys } from '../store.keys';
import { selectorsFactory } from '../store.utils';
import { InitState } from './init.slice';

export const initSelectors = selectorsFactory(StoreKeys.Init, InitState);

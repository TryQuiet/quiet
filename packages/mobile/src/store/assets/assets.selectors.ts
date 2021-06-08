import { selectorsFactory } from '../store.utils';
import { StoreKeys } from '../store.keys';
import { AssetsState } from './assets.slice';

export const assetsSelectors = selectorsFactory(StoreKeys.Assets, AssetsState);

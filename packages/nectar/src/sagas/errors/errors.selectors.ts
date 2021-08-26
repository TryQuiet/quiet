import { StoreKeys } from '../store.keys';
import { selectorsFactory } from '../store.utils';
import { ErrorsState } from './errors.slice';

export const errorsSelectors = selectorsFactory(
  StoreKeys.Errors,
  ErrorsState
);
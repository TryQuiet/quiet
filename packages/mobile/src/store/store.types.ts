import {rootReducer} from './root.reducer';
import {store} from './store';

export type StoreState = ReturnType<typeof rootReducer>;
export type StoreDispatch = typeof store.dispatch;

export type CreatedSelectors<SelectedState> = {
  [Key in keyof SelectedState]: (state: SelectedState) => SelectedState[Key];
};

export interface StoreModuleStateClass {
  new (): object;
}

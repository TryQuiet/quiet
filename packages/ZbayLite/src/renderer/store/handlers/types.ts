import { AnyAction, ActionCreator } from "redux";
import { ActionFunction0, Action, ReduxCompatibleReducer } from 'redux-actions'

export type ActionsBasicType = {
  [k: string]: ActionCreator<AnyAction>
}

export type ActionsType<actions extends ActionsBasicType> = {
  [k in keyof actions]: ReturnType<actions[k]>;
};

export type ActionsCreatorsBasicType = {
  [k: string]: (...args) => ActionFunction0<Action<any>>
}

export type ActionsCreatorsTypes<actionCreators extends ActionsCreatorsBasicType> = {
  [k in keyof actionCreators]: ReturnType<ReturnType<actionCreators[k]>>
}

export type StoreBasicType = {
  [key: string]: ReduxCompatibleReducer<any, any>
}

export type StoreType<reducers extends StoreBasicType> = {
  [k in keyof reducers]: ReturnType<reducers[k]>
}

export type PayloadType<
  actions extends ActionsType<ActionsBasicType>
> = actions[keyof actions]["payload"];

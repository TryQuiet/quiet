import { AnyAction, ActionCreator } from "redux";

type ActionsBasicType = {
  [k: string]: ActionCreator<AnyAction>;
};

export type ActionsType<actions extends ActionsBasicType> = {
  [k in keyof actions]: ReturnType<actions[k]>;
};

export type PayloadType<
  actions extends ActionsType<ActionsBasicType>
> = actions[keyof actions]["payload"];

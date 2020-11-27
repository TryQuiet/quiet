import { produce } from "immer";
import BigNumber from "bignumber.js";
import { createAction, handleActions } from "redux-actions";
import * as R from 'ramda'
import { updatePendingMessage } from "./contacts";

import { actionTypes } from "../../../shared/static";

import { ActionsType, PayloadType } from "./types";

const oneOf = (...arr) => (val) => R.includes(val, arr);

export const isFinished = oneOf("success", "cancelled", "failed");


export const ZcashError = {
  code: null,
  message: "",
};

export const ShieldBalanceOp = {
  amount: new BigNumber(0),
  from: "",
  to: "",
};

export const PendingMessageOp = {
  message: {},
  channelId: "",
};

export const PendingDirectMessageOp = {
  message: {},
  recipientAddress: "",
  recipientUsername: "",
  offerId: "",
};

// TODO: Used in many tests
export enum OperationTypes {
  shieldBalance = 'shieldBalance',
  pendingMessage = 'pendingMessage',
  pendingDirectMessage = 'pendingDirectMessage',
  pendingPlainTransfer = 'pendingPlainTransfer'
};

export class Operation {
  id: string = "";
  txid: string = "";
  error?: Error;

  constructor(values: Partial<Operation>) {
    Object.assign(this, values);
  }

};

export type OperationsStore = { [channelId: string]: { [operationId: string] : Operation } };

export const initialState: OperationsStore = {};

const addOperation = createAction<{ channelId: string; id: string }>(
  actionTypes.ADD_PENDING_OPERATION
  );
  const resolveOperation = createAction<{
    channelId: string;
    id: string;
  txid: string;
}>(actionTypes.RESOLVE_PENDING_OPERATION);
const removeOperation = createAction(actionTypes.REMOVE_PENDING_OPERATION);

export const actions = {
  addOperation,
  resolveOperation,
  removeOperation,
};

export type OperationsActions = ActionsType<typeof actions>;

const resolvePendingOperation = ({ channelId, id, txid }) => async (
  dispatch
) => {
  dispatch(updatePendingMessage({ id, txid, key: channelId }));
  dispatch(resolveOperation({ id, txid, channelId }));
};
export const epics = {
  resolvePendingOperation,
};

export const reducer = handleActions<
  OperationsStore,
    PayloadType<OperationsActions>
>(
  {
    [addOperation.toString()]: (
      state,
      { payload: { channelId, id } }: OperationsActions["addOperation"]
    ) =>
      produce(state, (draft) => {
        draft[channelId] = {
          [id]: {
          ...new Operation({ id }),          
          }}
      }),
    [resolveOperation.toString()]: (
      state,
      {
        payload: { channelId, id, txid },
      }: OperationsActions["resolveOperation"]
    ) =>
      produce(state, (draft) => {
        delete draft[channelId][id];
        draft[channelId][txid] = {
          ...new Operation({}),
          id,
          txid,
        };
      }),
  },
  initialState
);

export default {
  actions,
  epics,
  reducer,
};

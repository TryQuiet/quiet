import { produce } from "immer";
import BigNumber from "bignumber.js";
import { createAction, handleActions } from "redux-actions";
import * as R from "ramda";
// import contactsSelector from '../../store/selectors/contacts'
import { updatePendingMessage } from "./contacts";

import { actionTypes } from "../../../shared/static";

import { ActionsType } from "./types";

import { DisplayableMessage } from "../../zbay/messages.types";

const oneOf = (...arr) => (val) => R.includes(val, arr);

export const isFinished = oneOf("success", "cancelled", "failed");

export const initialState = {};

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

export const operationTypes = {
  shieldBalance: "shieldBalance",
  pendingMessage: "pendingMessage",
  pendingDirectMessage: "pendingDirectMessage",
  pendingPlainTransfer: "pendingPlainTransfer",
};

export const Operation = {
  id: "",
  txid: "",
  error: null,
};

interface IMeta {
  recipientAddress: string;
  message: DisplayableMessage;
  channelId: string;
}

export interface IOperation {
  type: string;
  meta: IMeta;
}

export type OperationStore = { [key: string]: IOperation[] };

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

export type OperationActions = ActionsType<typeof actions>;

const resolvePendingOperation = ({ channelId, id, txid }) => async (
  dispatch
) => {
  dispatch(updatePendingMessage({ id, txid, key: channelId }));
  dispatch(resolveOperation({ id, txid, channelId }));
};
export const epics = {
  resolvePendingOperation,
};

export const reducer = handleActions(
  {
    [addOperation.toString()]: (
      state,
      { payload: { channelId, id } }: OperationActions["addOperation"]
    ) =>
      produce(state, (draft) => {
        draft[channelId] = {};
        draft[channelId][id] = {
          ...Operation,
          id,
        };
      }),
    [resolveOperation.toString()]: (
      state,
      { payload: { channelId, id, txid } }: OperationActions["resolveOperation"]
    ) =>
      produce(state, (draft) => {
        delete draft[channelId][id];
        draft[channelId][txid] = {
          ...Operation,
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

import { createSelector } from "reselect";
import { operationTypes } from "../handlers/operations";

import { OperationStore } from "./../handlers/operations";

const store = (s): OperationStore => s.operations as OperationStore;

const operations = createSelector(store, (state) => state.operations);

const operationsByChannel = (channelId) =>
  createSelector(operations, (ops) => ops[channelId]);

const pendingMessages = createSelector(operations, (ops) =>
  Array.from(Object.values(ops)).filter(
    (o) => o.type === operationTypes.pendingMessage
  )
);

const pendingDirectMessages = createSelector(operations, (ops) =>
  ops.filter((o) => o.type === operationTypes.pendingDirectMessage)
);

export default {
  operations,
  pendingMessages,
  pendingDirectMessages,
  operationsByChannel,
};

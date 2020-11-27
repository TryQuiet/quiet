import { createSelector } from "reselect";

import { Store } from '../reducers'

const app = (s: Store) => s.app

const version = createSelector(app, (a) => a.version);
const useTor = createSelector(app, (a) => a.useTor);
const transfers = createSelector(app, (a) => a.transfers);
const currentModalTab = createSelector(app, (a) => a.modalTabToOpen);
const allTransfersCount = createSelector(app, (a) => a.allTransfersCount);
const newTransfersCounter = createSelector(app, (a) => a.newTransfersCounter);
const isInitialLoadFinished = createSelector(
  app,
  (a) => a.isInitialLoadFinished
);
const directMessageQueueLock = createSelector(
  app,
  (a) => a.directMessageQueueLock
);
const messageQueueLock = createSelector(app, (a) => a.messageQueueLock);
const allTransactionsId = createSelector(
  app,
  (a) => new Set(a.allTransactionsId)
);

export default {
  version,
  transfers,
  currentModalTab,
  allTransfersCount,
  newTransfersCounter,
  messageQueueLock,
  directMessageQueueLock,
  isInitialLoadFinished,
  useTor,
  allTransactionsId,
};

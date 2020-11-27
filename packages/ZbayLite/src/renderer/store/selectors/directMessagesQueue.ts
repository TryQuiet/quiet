import { createSelector } from "reselect";

import { Store } from '../reducers'

const store = (s: Store) => s.directMessagesQueue

const queue = createSelector(store, (state) => state);

export default {
  queue,
};

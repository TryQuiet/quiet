import { produce } from "immer";
import { ipcRenderer, remote } from "electron";
import BigNumber from "bignumber.js";
import { createAction, handleActions } from "redux-actions";
import { actionTypes } from "../../../shared/static";
import { actionCreators } from "./modals";
import nodeHandlers from "./node";
import client from "../../zcash";
import history from "../../../shared/history";
import electronStore from "../../../shared/electronStore";

import { ActionsType, PayloadType } from "./types";

export class App {
  version: string = null;
  transfers: { [key: string]: number } = {};
  newUser: boolean = false;
  modalTabToOpen: boolean = false;
  allTransfersCount: number = 0;
  newTransfersCounter: number = 0;
  directMessageQueueLock: boolean = false;
  messageQueueLock: boolean = false;
  isInitialLoadFinished: boolean = false;
  useTor: boolean = false;

  constructor(values?: Partial<App>) {
    Object.assign(this, values);
  }
}

export type AppStore = App;

export const initialState: App = {
  ...new App(),
};

const loadVersion = createAction(actionTypes.SET_APP_VERSION, () =>
  remote.app.getVersion()
);
const setTransfers = createAction<{ [key: string]: number }>(
  actionTypes.SET_TRANSFERS
);
const setUseTor = createAction<boolean>(actionTypes.SET_USE_TOR);
const setModalTab = createAction<boolean>(actionTypes.SET_CURRENT_MODAL_TAB);
const clearModalTab = createAction<null>(actionTypes.CLEAR_CURRENT_MODAL_TAB);
const setAllTransfersCount = createAction<number>(
  actionTypes.SET_ALL_TRANSFERS_COUNT
);
const setNewTransfersCount = createAction<number>(
  actionTypes.SET_NEW_TRANSFERS_COUNT
);
const lockDmQueue = createAction<boolean>(actionTypes.LOCK_DM_QUEUE);
const unlockDmQueue = createAction<boolean>(actionTypes.UNLOCK_DM_QUEUE);
const lockMessageQueue = createAction<boolean>(actionTypes.LOCK_MESSAGE_QUEUE);
const unlockMessageQueue = createAction<boolean>(
  actionTypes.UNLOCK_MESSAGE_QUEUE
);
const setInitialLoadFlag = createAction<boolean>(
  actionTypes.SET_INITIAL_LOAD_FLAG
);
const reduceNewTransfersCount = createAction<number>(
  actionTypes.REDUCE_NEW_TRANSFERS_COUNT
);

export const actions = {
  loadVersion,
  setTransfers,
  setUseTor,
  setModalTab,
  clearModalTab,
  setAllTransfersCount,
  setNewTransfersCount,
  lockDmQueue,
  unlockDmQueue,
  lockMessageQueue,
  unlockMessageQueue,
  setInitialLoadFlag,
  reduceNewTransfersCount,
};

export type AppActions = ActionsType<typeof actions>;

export const askForBlockchainLocation = () => async (dispatch, getState) => {
  dispatch(actionCreators.openModal("blockchainLocation")());
};

export const initializeUseTor = () => async (dispatch, getState) => {
  const savedUseTor = electronStore.get(`useTor`);
  if (savedUseTor !== undefined) {
    if (savedUseTor === true) {
      ipcRenderer.send("spawnTor");
    }
    dispatch(actions.setUseTor(savedUseTor));
  }
};

export const proceedWithSyncing = (payload) => async (dispatch, getState) => {
  ipcRenderer.send("proceed-with-syncing", payload);
  dispatch(actionCreators.closeModal("blockchainLocation")());
};

export const restartAndRescan = () => async (dispatch, getState) => {
  client.rescan();
  await dispatch(
    nodeHandlers.actions.setStatus({
      currentBlock: new BigNumber(0),
    })
  );
  await dispatch(nodeHandlers.actions.setIsRescanning(true));
  setTimeout(() => {
    history.push(`/vault`);
    electronStore.set("channelsToRescan", {});
    electronStore.set("isRescanned", true);
  }, 500);
};

export const reducer = handleActions<AppStore, PayloadType<AppActions>>(
  {
    [setNewTransfersCount.toString()]: (
      state,
      { payload: setNewTransfersCount }: AppActions["setNewTransfersCount"]
    ) =>
      produce(state, (draft) => {
        draft.newTransfersCounter = setNewTransfersCount;
      }),
    [setInitialLoadFlag.toString()]: (
      state,
      { payload: flag }: AppActions["setInitialLoadFlag"]
    ) =>
      produce(state, (draft) => {
        draft.isInitialLoadFinished = flag;
      }),
    [setUseTor.toString()]: (
      state,
      { payload: flag }: AppActions["setUseTor"]
    ) =>
      produce(state, (draft) => {
        draft.useTor = flag;
      }),
    [reduceNewTransfersCount.toString()]: (
      state,
      { payload: amount }: AppActions["reduceNewTransfersCount"]
    ) =>
      produce(state, (draft) => {
        draft.newTransfersCounter = draft.newTransfersCounter - amount;
      }),
    [loadVersion.toString()]: (
      state,
      { payload: version }: AppActions["loadVersion"]
    ) =>
      produce(state, (draft) => {
        draft.version = version;
      }),
    [setModalTab.toString()]: (
      state,
      { payload: tabName }: AppActions["setModalTab"]
    ) =>
      produce(state, (draft) => {
        draft.modalTabToOpen = tabName;
      }),
    [setAllTransfersCount.toString()]: (
      state,
      { payload: transfersCount }: AppActions["setAllTransfersCount"]
    ) =>
      produce(state, (draft) => {
        draft.allTransfersCount = transfersCount;
      }),
    [clearModalTab.toString()]: (state) =>
      produce(state, (draft) => {
        draft.modalTabToOpen = null;
      }),
    [lockDmQueue.toString()]: (state) =>
      produce(state, (draft) => {
        draft.directMessageQueueLock = true;
      }),
    [unlockDmQueue.toString()]: (state) =>
      produce(state, (draft) => {
        draft.directMessageQueueLock = false;
      }),
    [lockMessageQueue.toString()]: (state) =>
      produce(state, (draft) => {
        draft.messageQueueLock = true;
      }),
    [unlockMessageQueue.toString()]: (state) =>
      produce(state, (draft) => {
        draft.messageQueueLock = false;
      }),
    [setTransfers.toString()]: (
      state,
      { payload: { id, value } }: AppActions["setTransfers"]
    ) =>
      produce(state, (draft) => {
        draft.transfers[id] = value;
      }),
  },
  initialState
);

export const epics = {
  askForBlockchainLocation,
  proceedWithSyncing,
  restartAndRescan,
  initializeUseTor,
};

export default {
  epics,
  actions,
  reducer,
};

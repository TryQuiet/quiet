import { produce } from "immer";
import { createAction, handleActions } from "redux-actions";
import { actionTypes } from "../../../shared/static";
import { ActionsType, PayloadType} from "./types";
import {
  IInfoNotification,
  ISuccessNotification,
  IErrorNotification,
} from "./utils";

export type NotificationStore = IInfoNotification[]
export const initialState: NotificationStore = []

const enqueueSnackbar = createAction<
  IInfoNotification,
  ISuccessNotification | IErrorNotification
>(actionTypes.ENQUEUE_SNACKBAR, (n: ISuccessNotification) => ({
  key: new Date().getTime().toString() + Math.random(),
  ...n,
}));

const removeSnackbar = createAction<string>(actionTypes.REMOVE_SNACKBAR);

export const actions = {
  enqueueSnackbar,
  removeSnackbar,
};

export type NotificationActions = ActionsType<typeof actions>;

// TODO: [refactoring] rewrite rest of the notifications to use Notifier
export const reducer = handleActions<
  NotificationStore,
  PayloadType<NotificationActions>
>(
  {
    [enqueueSnackbar.toString()]: (
      state,
      { payload: notification }: NotificationActions["enqueueSnackbar"]
    ) => {
      return produce(state, (draft) => {
        draft.push(notification);
      });
    },
    [removeSnackbar.toString()]: (
      state,
      { payload: key }: NotificationActions["removeSnackbar"]
    ) => produce(state, (draft) => draft.filter((n) => n.key !== key)),
  },
  initialState
);

export default {
  actions,
  reducer,
};
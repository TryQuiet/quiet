import Immutable from 'immutable'

import { notifierAction } from '../../components/ui/DismissSnackbarAction'

export const typePending = name => `${name}_PENDING`
export const typeFulfilled = name => `${name}_FULFILLED`
export const typeRejected = name => `${name}_REJECTED`

export const errorNotification = ({ message, options }) => ({
  message,
  options: {
    persist: false,
    variant: 'error',
    action: notifierAction,
    ...options
  }
})

export const successNotification = ({ message, options }) => ({
  message,
  options: {
    variant: 'success',
    ...options
  }
})

export const LoaderState = Immutable.Record({
  loading: false,
  message: ''
})

export const FetchingState = Immutable.Record({
  sizeLeft: 0,
  part: '',
  fetchingStatus: '',
  fetchingSpeed: null,
  fetchingEndTime: {
    hours: null,
    minutes: null,
    seconds: null
  },
  isFetching: false,
  rescanningProgress: 0,
  isRescanningMonitorStarted: false
})

export default {
  typePending,
  typeFulfilled,
  typeRejected
}

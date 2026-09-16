import { createSelector } from 'reselect'
import { currentCommunityId } from '../communities/communities.selectors'
import { StoreKeys } from '../store.keys'
import { type CreatedSelectors, type StoreState } from '../store.types'
import { errorsAdapter } from './errors.adapter'
import { type ErrorPayload, ErrorMessages, SocketActions } from '@quiet/types'

const errorSlice: CreatedSelectors[StoreKeys.Errors] = (state: StoreState) => state[StoreKeys.Errors]

export const selectEntities = createSelector(errorSlice, reducerState => {
  return errorsAdapter.getSelectors().selectEntities(reducerState.errors)
})

export const selectAll = createSelector(errorSlice, reducerState => {
  return errorsAdapter.getSelectors().selectAll(reducerState.errors)
})

export const generalErrors = createSelector(selectAll, errors => {
  if (!errors) return null
  return errors.filter(error => !error.community)
})

const generalErrorByType = (errorType: string) => {
  return createSelector(generalErrors, errors => {
    if (!errors || !errors.length) return null
    return errors.find(error => error.type === errorType)
  })
}

export const currentCommunityErrors = createSelector(currentCommunityId, selectAll, (community, errors) => {
  if (!community || !errors) {
    return {}
  }
  const communityErrors = errors.filter(error => error.community === community)
  return communityErrors.reduce((types: Record<string, ErrorPayload>, error) => {
    types[error.type] = error
    return types
  }, {})
})

export const errorsSelectors = {
  admissionFailure: createSelector(currentCommunityErrors, errors => {
    const message = errors[SocketActions.LAUNCH_COMMUNITY]?.message
    if (message === ErrorMessages.ADMISSION_TIMEOUT) return 'timeout' as const
    if (message === ErrorMessages.ADMISSION_INTERRUPTED) return 'interrupted' as const
    return null
  }),
  admissionTimedOut: createSelector(
    currentCommunityErrors,
    errors => errors[SocketActions.LAUNCH_COMMUNITY]?.message === ErrorMessages.ADMISSION_TIMEOUT
  ),
  generalErrors,
  generalErrorByType,
  currentCommunityErrors,
}
